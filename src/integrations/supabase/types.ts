export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      assentos: {
        Row: {
          andar: string | null
          created_at: string
          id: string
          id_viagem: string | null
          numero_poltrona: number
          posicao: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          andar?: string | null
          created_at?: string
          id?: string
          id_viagem?: string | null
          numero_poltrona: number
          posicao?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          andar?: string | null
          created_at?: string
          id?: string
          id_viagem?: string | null
          numero_poltrona?: number
          posicao?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assentos_id_viagem_fkey"
            columns: ["id_viagem"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          andar_onibus: string | null
          arquivado: boolean | null
          bairro: string | null
          cep: string | null
          cidade: string | null
          cor_grupo: string | null
          cpf: string | null
          created_at: string
          data_nascimento: string | null
          e_crianca_colo: boolean | null
          email: string | null
          estado: string | null
          forma_pagamento: string | null
          id: string
          id_cliente_principal: string | null
          id_quarto: string | null
          id_viagem: string | null
          idade: number | null
          idade_crianca_colo: number | null
          local_embarque: string | null
          nome_completo: string
          nome_crianca_colo: string | null
          numero: string | null
          numero_grupo: number | null
          numero_parcelas: number | null
          observacoes: string | null
          poltrona: number | null
          possui_crianca_colo: boolean | null
          rua: string | null
          sexo: string | null
          status_pagamento: string | null
          telefone: string | null
          updated_at: string
          valor_pago: number | null
          valor_personalizado: number | null
          valor_selecionado: string | null
          valor_total_pacote: number | null
        }
        Insert: {
          andar_onibus?: string | null
          arquivado?: boolean | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cor_grupo?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          e_crianca_colo?: boolean | null
          email?: string | null
          estado?: string | null
          forma_pagamento?: string | null
          id?: string
          id_cliente_principal?: string | null
          id_quarto?: string | null
          id_viagem?: string | null
          idade?: number | null
          idade_crianca_colo?: number | null
          local_embarque?: string | null
          nome_completo: string
          nome_crianca_colo?: string | null
          numero?: string | null
          numero_grupo?: number | null
          numero_parcelas?: number | null
          observacoes?: string | null
          poltrona?: number | null
          possui_crianca_colo?: boolean | null
          rua?: string | null
          sexo?: string | null
          status_pagamento?: string | null
          telefone?: string | null
          updated_at?: string
          valor_pago?: number | null
          valor_personalizado?: number | null
          valor_selecionado?: string | null
          valor_total_pacote?: number | null
        }
        Update: {
          andar_onibus?: string | null
          arquivado?: boolean | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cor_grupo?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          e_crianca_colo?: boolean | null
          email?: string | null
          estado?: string | null
          forma_pagamento?: string | null
          id?: string
          id_cliente_principal?: string | null
          id_quarto?: string | null
          id_viagem?: string | null
          idade?: number | null
          idade_crianca_colo?: number | null
          local_embarque?: string | null
          nome_completo?: string
          nome_crianca_colo?: string | null
          numero?: string | null
          numero_grupo?: number | null
          numero_parcelas?: number | null
          observacoes?: string | null
          poltrona?: number | null
          possui_crianca_colo?: boolean | null
          rua?: string | null
          sexo?: string | null
          status_pagamento?: string | null
          telefone?: string | null
          updated_at?: string
          valor_pago?: number | null
          valor_personalizado?: number | null
          valor_selecionado?: string | null
          valor_total_pacote?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_id_cliente_principal_fkey"
            columns: ["id_cliente_principal"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_id_quarto_fkey"
            columns: ["id_quarto"]
            isOneToOne: false
            referencedRelation: "quartos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_id_viagem_fkey"
            columns: ["id_viagem"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracao_empresa: {
        Row: {
          cor_primaria: string | null
          cor_secundaria: string | null
          created_at: string
          descricao: string | null
          email: string | null
          endereco: string | null
          facebook: string | null
          id: string
          instagram: string | null
          logo_url: string | null
          nome_empresa: string | null
          site: string | null
          slogan: string | null
          sobre_nos: string | null
          telefone: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          cor_primaria?: string | null
          cor_secundaria?: string | null
          created_at?: string
          descricao?: string | null
          email?: string | null
          endereco?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          nome_empresa?: string | null
          site?: string | null
          slogan?: string | null
          sobre_nos?: string | null
          telefone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          cor_primaria?: string | null
          cor_secundaria?: string | null
          created_at?: string
          descricao?: string | null
          email?: string | null
          endereco?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          nome_empresa?: string | null
          site?: string | null
          slogan?: string | null
          sobre_nos?: string | null
          telefone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      contatos: {
        Row: {
          created_at: string
          email: string | null
          id: string
          lida: boolean | null
          mensagem: string | null
          nome: string
          status: string | null
          telefone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          lida?: boolean | null
          mensagem?: string | null
          nome: string
          status?: string | null
          telefone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          lida?: boolean | null
          mensagem?: string | null
          nome?: string
          status?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      despesas_pessoal: {
        Row: {
          categoria: string
          comprovante_url: string | null
          created_at: string
          data_pagamento: string | null
          data_vencimento: string | null
          descricao: string
          forma_pagamento: string | null
          id: string
          id_membro_equipe: string | null
          id_viagem: string | null
          observacoes: string | null
          recorrente: boolean | null
          status: string
          updated_at: string
          valor: number
        }
        Insert: {
          categoria?: string
          comprovante_url?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          descricao: string
          forma_pagamento?: string | null
          id?: string
          id_membro_equipe?: string | null
          id_viagem?: string | null
          observacoes?: string | null
          recorrente?: boolean | null
          status?: string
          updated_at?: string
          valor?: number
        }
        Update: {
          categoria?: string
          comprovante_url?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          descricao?: string
          forma_pagamento?: string | null
          id?: string
          id_membro_equipe?: string | null
          id_viagem?: string | null
          observacoes?: string | null
          recorrente?: boolean | null
          status?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "despesas_pessoal_id_membro_equipe_fkey"
            columns: ["id_membro_equipe"]
            isOneToOne: false
            referencedRelation: "equipe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "despesas_pessoal_id_viagem_fkey"
            columns: ["id_viagem"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_viagem: {
        Row: {
          conteudo: string | null
          created_at: string
          id: string
          id_viagem: string | null
          nome: string | null
          tipo: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          conteudo?: string | null
          created_at?: string
          id?: string
          id_viagem?: string | null
          nome?: string | null
          tipo?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          conteudo?: string | null
          created_at?: string
          id?: string
          id_viagem?: string | null
          nome?: string | null
          tipo?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_viagem_id_viagem_fkey"
            columns: ["id_viagem"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      equipe: {
        Row: {
          ativo: boolean | null
          cargo: string | null
          cpf: string | null
          created_at: string
          email: string | null
          foto_url: string | null
          funcao: string | null
          id: string
          id_viagem: string | null
          nome: string
          nome_completo: string | null
          status: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          cargo?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          foto_url?: string | null
          funcao?: string | null
          id?: string
          id_viagem?: string | null
          nome: string
          nome_completo?: string | null
          status?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          cargo?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          foto_url?: string | null
          funcao?: string | null
          id?: string
          id_viagem?: string | null
          nome?: string
          nome_completo?: string | null
          status?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipe_id_viagem_fkey"
            columns: ["id_viagem"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      formularios: {
        Row: {
          ativo: boolean | null
          campos: Json | null
          created_at: string
          descricao: string | null
          id: string
          titulo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          campos?: Json | null
          created_at?: string
          descricao?: string | null
          id?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          campos?: Json | null
          created_at?: string
          descricao?: string | null
          id?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      formularios_contrato: {
        Row: {
          bairro: string | null
          cidade: string | null
          cpf: string | null
          created_at: string
          data_nascimento: string | null
          desconto: number | null
          dia_vencimento: number | null
          email: string | null
          estado_civil: string | null
          forma_pagamento: string | null
          id: string
          id_viagem: string | null
          idade_crianca_colo: number | null
          nome_completo: string
          nome_crianca_colo: string | null
          numero: string | null
          numero_parcelas: number | null
          passageiros: Json | null
          possui_crianca_colo: boolean | null
          rg: string | null
          rua: string | null
          sexo: string | null
          status: string | null
          telefone: string | null
          updated_at: string
          valor_total: number | null
        }
        Insert: {
          bairro?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          desconto?: number | null
          dia_vencimento?: number | null
          email?: string | null
          estado_civil?: string | null
          forma_pagamento?: string | null
          id?: string
          id_viagem?: string | null
          idade_crianca_colo?: number | null
          nome_completo: string
          nome_crianca_colo?: string | null
          numero?: string | null
          numero_parcelas?: number | null
          passageiros?: Json | null
          possui_crianca_colo?: boolean | null
          rg?: string | null
          rua?: string | null
          sexo?: string | null
          status?: string | null
          telefone?: string | null
          updated_at?: string
          valor_total?: number | null
        }
        Update: {
          bairro?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          desconto?: number | null
          dia_vencimento?: number | null
          email?: string | null
          estado_civil?: string | null
          forma_pagamento?: string | null
          id?: string
          id_viagem?: string | null
          idade_crianca_colo?: number | null
          nome_completo?: string
          nome_crianca_colo?: string | null
          numero?: string | null
          numero_parcelas?: number | null
          passageiros?: Json | null
          possui_crianca_colo?: boolean | null
          rg?: string | null
          rua?: string | null
          sexo?: string | null
          status?: string | null
          telefone?: string | null
          updated_at?: string
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "formularios_contrato_id_viagem_fkey"
            columns: ["id_viagem"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          ativo: boolean | null
          cnpj: string | null
          contato: string | null
          created_at: string
          email: string | null
          endereco: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          tipo: string | null
          tipo_servico: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          cnpj?: string | null
          contato?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          tipo?: string | null
          tipo_servico?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          cnpj?: string | null
          contato?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          tipo?: string | null
          tipo_servico?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      logs_auditoria: {
        Row: {
          acao: string
          created_at: string
          detalhes: Json | null
          entidade: string | null
          entidade_id: string | null
          id: string
          usuario_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          detalhes?: Json | null
          entidade?: string | null
          entidade_id?: string | null
          id?: string
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          detalhes?: Json | null
          entidade?: string | null
          entidade_id?: string | null
          id?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      mensagens: {
        Row: {
          conteudo: string | null
          created_at: string
          destinatario_id: string | null
          id: string
          lida: boolean | null
          remetente_id: string | null
        }
        Insert: {
          conteudo?: string | null
          created_at?: string
          destinatario_id?: string | null
          id?: string
          lida?: boolean | null
          remetente_id?: string | null
        }
        Update: {
          conteudo?: string | null
          created_at?: string
          destinatario_id?: string | null
          id?: string
          lida?: boolean | null
          remetente_id?: string | null
        }
        Relationships: []
      }
      pagamentos: {
        Row: {
          comprovante_url: string | null
          created_at: string
          data_pagamento: string | null
          forma_pagamento: string | null
          id: string
          id_cliente: string | null
          numero_parcela: number | null
          observacoes: string | null
          updated_at: string
          valor: number | null
        }
        Insert: {
          comprovante_url?: string | null
          created_at?: string
          data_pagamento?: string | null
          forma_pagamento?: string | null
          id?: string
          id_cliente?: string | null
          numero_parcela?: number | null
          observacoes?: string | null
          updated_at?: string
          valor?: number | null
        }
        Update: {
          comprovante_url?: string | null
          created_at?: string
          data_pagamento?: string | null
          forma_pagamento?: string | null
          id?: string
          id_cliente?: string | null
          numero_parcela?: number | null
          observacoes?: string | null
          updated_at?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos_empresa: {
        Row: {
          categoria: string | null
          comprovante_url: string | null
          created_at: string
          data_pagamento: string | null
          descricao: string
          fornecedor: string | null
          id: string
          id_viagem: string | null
          observacoes: string | null
          updated_at: string
          valor: number | null
        }
        Insert: {
          categoria?: string | null
          comprovante_url?: string | null
          created_at?: string
          data_pagamento?: string | null
          descricao: string
          fornecedor?: string | null
          id?: string
          id_viagem?: string | null
          observacoes?: string | null
          updated_at?: string
          valor?: number | null
        }
        Update: {
          categoria?: string | null
          comprovante_url?: string | null
          created_at?: string
          data_pagamento?: string | null
          descricao?: string
          fornecedor?: string | null
          id?: string
          id_viagem?: string | null
          observacoes?: string | null
          updated_at?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_empresa_id_viagem_fkey"
            columns: ["id_viagem"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      parcelas: {
        Row: {
          comprovante_url: string | null
          created_at: string
          data_pagamento: string | null
          data_vencimento: string | null
          forma_pagamento: string | null
          id: string
          id_cliente: string | null
          id_viagem: string | null
          intervalo_dias: number | null
          numero_parcela: number
          observacoes: string | null
          status: string | null
          total_parcelas: number
          updated_at: string
          valor_parcela: number | null
        }
        Insert: {
          comprovante_url?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          forma_pagamento?: string | null
          id?: string
          id_cliente?: string | null
          id_viagem?: string | null
          intervalo_dias?: number | null
          numero_parcela: number
          observacoes?: string | null
          status?: string | null
          total_parcelas: number
          updated_at?: string
          valor_parcela?: number | null
        }
        Update: {
          comprovante_url?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          forma_pagamento?: string | null
          id?: string
          id_cliente?: string | null
          id_viagem?: string | null
          intervalo_dias?: number | null
          numero_parcela?: number
          observacoes?: string | null
          status?: string | null
          total_parcelas?: number
          updated_at?: string
          valor_parcela?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "parcelas_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parcelas_id_viagem_fkey"
            columns: ["id_viagem"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cargo: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quartos: {
        Row: {
          camas_beliche: number | null
          camas_casal: number | null
          camas_extra: number | null
          camas_solteiro: number | null
          capacidade: number | null
          created_at: string
          id: string
          id_viagem: string | null
          numero_quarto: string
          ocupados: number | null
          tipo: string | null
          updated_at: string
        }
        Insert: {
          camas_beliche?: number | null
          camas_casal?: number | null
          camas_extra?: number | null
          camas_solteiro?: number | null
          capacidade?: number | null
          created_at?: string
          id?: string
          id_viagem?: string | null
          numero_quarto: string
          ocupados?: number | null
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          camas_beliche?: number | null
          camas_casal?: number | null
          camas_extra?: number | null
          camas_solteiro?: number | null
          capacidade?: number | null
          created_at?: string
          id?: string
          id_viagem?: string | null
          numero_quarto?: string
          ocupados?: number | null
          tipo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quartos_id_viagem_fkey"
            columns: ["id_viagem"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      viagens: {
        Row: {
          arquivada: boolean | null
          created_at: string
          data_retorno: string | null
          data_saida: string | null
          destino: string
          id: string
          imagem_url: string | null
          imagens_urls: string[] | null
          modelo_onibus: string | null
          modo_pirapark: boolean | null
          nome: string
          status: string | null
          updated_at: string
          vagas_ocupadas: number | null
          vagas_totais: number | null
          valor_1: number | null
          valor_2: number | null
          valor_3: number | null
        }
        Insert: {
          arquivada?: boolean | null
          created_at?: string
          data_retorno?: string | null
          data_saida?: string | null
          destino: string
          id?: string
          imagem_url?: string | null
          imagens_urls?: string[] | null
          modelo_onibus?: string | null
          modo_pirapark?: boolean | null
          nome: string
          status?: string | null
          updated_at?: string
          vagas_ocupadas?: number | null
          vagas_totais?: number | null
          valor_1?: number | null
          valor_2?: number | null
          valor_3?: number | null
        }
        Update: {
          arquivada?: boolean | null
          created_at?: string
          data_retorno?: string | null
          data_saida?: string | null
          destino?: string
          id?: string
          imagem_url?: string | null
          imagens_urls?: string[] | null
          modelo_onibus?: string | null
          modo_pirapark?: boolean | null
          nome?: string
          status?: string | null
          updated_at?: string
          vagas_ocupadas?: number | null
          vagas_totais?: number | null
          valor_1?: number | null
          valor_2?: number | null
          valor_3?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "employee"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "employee"],
    },
  },
} as const
