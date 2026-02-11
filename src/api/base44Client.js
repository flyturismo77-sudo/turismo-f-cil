// Compatibility layer: replaces Base44 SDK with Supabase calls
import { supabase } from '@/lib/supabaseClient';

// Add created_date alias for backward compatibility with Base44 field names
const addFieldAliases = (record) => {
  if (!record) return record;
  if (Array.isArray(record)) return record.map(addFieldAliases);
  return {
    ...record,
    created_date: record.created_at,
    updated_date: record.updated_at,
  };
};

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
    return addFieldAliases(data || []);
  },

  async filter(filters, orderBy, limit) {
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
    if (limit) {
      query = query.limit(limit);
    }
    const { data, error } = await query;
    if (error) throw error;
    return addFieldAliases(data || []);
  },

  async get(id) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return addFieldAliases(data);
  },

  async create(record) {
    const { data, error } = await supabase
      .from(tableName)
      .insert(record)
      .select()
      .single();
    if (error) throw error;
    return addFieldAliases(data);
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
    return addFieldAliases(data);
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
    return addFieldAliases(data || []);
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
  FormularioContrato: 'formularios_contrato',
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
      try {
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/send-email`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1emZkd2tqcXFzYXlpc2ZsbHd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MzI4ODksImV4cCI6MjA4NjQwODg4OX0.DKdBuaeaPunvxh_gawqaDHva3nOI0Qcbvby6zMV_8PA',
            },
            body: JSON.stringify({ to, subject, body }),
          }
        );
        const data = await response.json();
        return data;
      } catch (err) {
        console.warn('SendEmail falhou:', err);
        return { success: false, message: err.message };
      }
    },
  },
};

export const base44 = {
  entities,
  auth,
  appLogs,
  integrations,
};
