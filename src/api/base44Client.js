// Compatibility layer: replaces Base44 SDK with Supabase calls
import { supabase } from '@/lib/supabaseClient';

// Generic entity wrapper that maps Base44 entity operations to Supabase
const createEntityProxy = (tableName) => ({
  async list(orderBy) {
    let query = supabase.from(tableName).select('*');
    if (orderBy) {
      const desc = orderBy.startsWith('-');
      const column = desc ? orderBy.slice(1) : orderBy;
      // Map common Base44 fields to Supabase
      const col = column === 'created_date' ? 'created_at' : column;
      query = query.order(col, { ascending: !desc });
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async filter(filters, orderBy) {
    let query = supabase.from(tableName).select('*');
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    if (orderBy) {
      const desc = orderBy.startsWith('-');
      const column = desc ? orderBy.slice(1) : orderBy;
      const col = column === 'created_date' ? 'created_at' : column;
      query = query.order(col, { ascending: !desc });
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async get(id) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(record) {
    const { data, error } = await supabase
      .from(tableName)
      .insert(record)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, record) {
    // Remove id from update payload
    const { id: _, ...updateData } = record;
    const { data, error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async bulkCreate(records) {
    const { data, error } = await supabase
      .from(tableName)
      .insert(records)
      .select();
    if (error) throw error;
    return data || [];
  },
});

// Map Base44 entity names to Supabase table names
const entityTableMap = {
  Viagem: 'viagens',
  Cliente: 'clientes',
  Pagamento: 'pagamentos',
  ConfiguracaoEmpresa: 'configuracao_empresa',
  Quarto: 'quartos',
  DocumentoViagem: 'documentos_viagem',
  Assento: 'assentos',
  Equipe: 'equipe',
  Contato: 'contatos',
  PagamentoEmpresa: 'pagamentos_empresa',
  Fornecedor: 'fornecedores',
  Formulario: 'formularios',
  Mensagem: 'mensagens',
  Usuario: 'profiles',
  User: 'profiles',
  LogAuditoria: 'logs_auditoria',
  Parcela: 'parcelas',
};

// Create entity proxies
const entities = {};
Object.entries(entityTableMap).forEach(([entityName, tableName]) => {
  entities[entityName] = createEntityProxy(tableName);
});

// Auth compatibility layer
const auth = {
  async me() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw { status: 401, message: 'Not authenticated' };
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    return {
      ...user,
      ...profile,
      role: roleData?.some(r => r.role === 'admin') ? 'admin' : 'employee',
    };
  },

  async logout(redirectUrl) {
    await supabase.auth.signOut();
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  },

  redirectToLogin(returnUrl) {
    // Store return URL and redirect to login page
    if (returnUrl) {
      localStorage.setItem('returnUrl', returnUrl);
    }
    window.location.href = '/Login';
  },
};

// AppLogs compatibility (no-op for now)
const appLogs = {
  logUserInApp: async () => {},
};

// Integrations compatibility layer (replaces Base44 Core integrations)
const SUPABASE_URL = "https://duzfdwkjqqsayisfllww.supabase.co";

const integrations = {
  Core: {
    async UploadFile({ file }) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error } = await supabase.storage
        .from('uploads')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      return { file_url: publicUrl };
    },

    async SendEmail({ to, subject, body }) {
      // Email sending is not available without an edge function
      // Log it for now and show a toast-friendly message
      console.log(`[SendEmail] To: ${to}, Subject: ${subject}`);
      console.warn('SendEmail: funcionalidade de email não configurada. Configure um serviço de email via Edge Function.');
      return { success: false, message: 'Email service not configured' };
    },
  },
};

export const base44 = {
  entities,
  auth,
  appLogs,
  integrations,
};
