const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Banco de Dados
const db = new sqlite3.Database('./banco.db');

// Configurar Express
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // aceitar JSON
app.use(express.static(path.join(__dirname, 'public')));

// Criação das tabelas (se não existirem)
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS usuario (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    senha TEXT NOT NULL,
    telefone TEXT NOT NULL,
    endereco TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS instituicao (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    senha TEXT NOT NULL,
    telefone TEXT NOT NULL,
    endereco TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS doacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id TEXT,
    instituicao_id TEXT,
    roupas TEXT,
    data TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS conversas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id TEXT,
    instituicao_id TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS mensagens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversa_id INTEGER,
    remetente_id TEXT,
    texto TEXT,
    data TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS notificacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id TEXT,
    instituicao_id TEXT,
    titulo TEXT,
    texto TEXT,
    link TEXT,
    data TEXT,
    lida INTEGER DEFAULT 0
  )`);
});

// Rotas

// Página inicial
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Página de login
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Página de cadastro
app.get('/cadastro', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cadastro.html'));
});

// Página Home (nova)
app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// API para buscar dados dos usuários e instituições (nova)
app.get('/dados', (req, res) => {
  const usuarios = [];
  const instituicoes = [];

  db.all(`SELECT * FROM usuario`, [], (err, rowsUsuario) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Erro ao buscar usuários' });
    }

    usuarios.push(...rowsUsuario);

    db.all(`SELECT * FROM instituicao`, [], (err, rowsInstituicao) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: 'Erro ao buscar instituições' });
      }

      instituicoes.push(...rowsInstituicao);

      res.json({ usuarios, instituicoes });
    });
  });
});

// Rota para buscar doações de todos os usuários
app.get('/doacoes', (req, res) => {
  db.all(`SELECT doacoes.usuario_id, usuario.nome as usuario_nome, usuario.endereco as usuario_endereco, usuario.email as usuario_email, usuario.telefone as usuario_telefone, doacoes.roupas FROM doacoes LEFT JOIN usuario ON doacoes.usuario_id = usuario.id`, [], (err, rows) => {
    if (err) {
      console.error('Erro ao buscar doações:', err.message);
      return res.status(500).json({ error: 'Erro ao buscar doações' });
    }
    res.json(rows);
  });
});

// Cadastro de usuário ou instituição
app.post('/cadastrar', (req, res) => {
  const { tipo, id, nome, email, senha, telefone, endereco } = req.body;

  console.log('Dados recebidos:', req.body);

  if (!tipo || !id || !nome || !email || !senha || !telefone || !endereco) {
    return res.send('Preencha todos os campos.');
  }

  if (tipo === 'usuario') {
    db.run(
      `INSERT INTO usuario (id, nome, email, senha, telefone, endereco) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, nome, email, senha, telefone, endereco],
      function (err) {
        if (err) {
          console.error(err.message);
          return res.send('Erro ao cadastrar usuário. CPF já cadastrado?');
        } else {
          console.log('Usuário cadastrado com sucesso!');
          return res.send('Usuário cadastrado com sucesso!');
        }
      }
    );
  } else if (tipo === 'instituicao') {
    db.run(
      `INSERT INTO instituicao (id, nome, email, senha, telefone, endereco) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, nome, email, senha, telefone, endereco],
      function (err) {
        if (err) {
          console.error(err.message);
          return res.send('Erro ao cadastrar instituição. CNPJ já cadastrado?');
        } else {
          console.log('Instituição cadastrada com sucesso!');
          return res.send('Instituição cadastrada com sucesso!');
        }
      }
    );
  } else {
    res.send('Tipo inválido.');
  }
});

// Login de usuário ou instituição (alterado)
app.post('/login', (req, res) => {
  const { tipo, id, senha } = req.body;

  if (!tipo || !id || !senha) {
    return res.json({ sucesso: false, mensagem: 'Preencha todos os campos.' });
  }

  const tabela = (tipo === 'usuario') ? 'usuario' : 'instituicao';

  db.get(`SELECT * FROM ${tabela} WHERE id = ? AND senha = ?`, [id, senha], (err, row) => {
    if (err) {
      console.error('Erro no login:', err.message);
      return res.json({ sucesso: false });
    }

    if (row) {
      return res.json({ 
        sucesso: true, 
        redirecionar: tipo === 'usuario' ? '/home.html' : '/home_instituicao.html',
        tipo: tipo,
        id: id
      });
    } else {
      return res.json({ sucesso: false });
    }
  });
});

// Nova rota para verificar o tipo de usuário
app.get('/verificar-tipo', (req, res) => {
  const { id } = req.query;
  
  if (!id) {
    return res.json({ tipo: null });
  }

  // Verifica primeiro na tabela de usuários
  db.get('SELECT id FROM usuario WHERE id = ?', [id], (err, rowUsuario) => {
    if (err) {
      return res.json({ tipo: null });
    }

    if (rowUsuario) {
      return res.json({ tipo: 'usuario' });
    }

    // Se não encontrou na tabela de usuários, verifica na tabela de instituições
    db.get('SELECT id FROM instituicao WHERE id = ?', [id], (err, rowInstituicao) => {
      if (err) {
        return res.json({ tipo: null });
      }

      if (rowInstituicao) {
        return res.json({ tipo: 'instituicao' });
      }

      return res.json({ tipo: null });
    });
  });
});

// Registrar doação
app.post('/doar', (req, res) => {
  const { usuario_id, instituicao_id, roupas } = req.body;
  const data = new Date().toISOString();

  // Verifica se já existe uma doação para este usuário
  db.get('SELECT id FROM doacoes WHERE usuario_id = ?', [usuario_id], (err, row) => {
    if (err) return res.status(500).send('Erro ao verificar doação existente');
    if (row) {
      // Atualiza a doação existente
      db.run('UPDATE doacoes SET roupas = ?, data = ? WHERE id = ?', [roupas.join(','), data, row.id], function(err2) {
        if (err2) return res.status(500).send('Erro ao atualizar doação');
        res.send('Doação atualizada com sucesso!');
      });
    } else {
      // Cria uma nova doação
      db.run(
        'INSERT INTO doacoes (usuario_id, instituicao_id, roupas, data) VALUES (?, ?, ?, ?)',
        [usuario_id, instituicao_id, roupas.join(','), data],
        function(err3) {
          if (err3) return res.status(500).send('Erro ao registrar doação');
          res.send('Doação registrada com sucesso!');
        }
      );
    }
  });
});

// Atualizar perfil
app.post('/atualizar-perfil', (req, res) => {
  const { tipo, id, email, telefone, endereco, senha } = req.body;

  console.log('Recebido para atualização:', req.body); // Log dos dados recebidos

  if (!tipo || !id || !email || !telefone || !endereco) {
    console.log('Erro: campos obrigatórios faltando', { tipo, id, email, telefone, endereco });
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
  }

  // Validação de email
  if (!/^[^\s@]+@[^\s@]+\.(com|com\.br|net|org)$/i.test(email)) {
    console.log('Erro: email inválido', email);
    return res.status(400).json({ error: 'Email inválido!' });
  }

  // Validação de telefone
  const telefoneNumerico = telefone.replace(/\D/g, '');
  if (telefoneNumerico.length < 9) {
    console.log('Erro: telefone inválido', telefone);
    return res.status(400).json({ error: 'Telefone inválido!' });
  }

  // Validação de CEP
  const cepNumerico = endereco.replace(/\D/g, '');
  if (cepNumerico.length !== 8) {
    console.log('Erro: CEP inválido', endereco);
    return res.status(400).json({ error: 'CEP inválido!' });
  }

  const tabela = tipo === 'usuario' ? 'usuario' : 'instituicao';

  // Primeiro, verifica se o usuário/instituição existe
  db.get(`SELECT * FROM ${tabela} WHERE id = ?`, [id], (err, row) => {
    if (err) {
      console.error('Erro ao verificar usuário:', err.message);
      return res.status(500).json({ error: 'Erro ao verificar usuário.' });
    }

    if (!row) {
      console.log('Erro: usuário não encontrado', id);
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Se chegou aqui, o usuário existe e pode ser atualizado
    let query = `UPDATE ${tabela} SET email = ?, telefone = ?, endereco = ?`;
    let params = [email, telefone, endereco];

    if (senha) {
      query += ', senha = ?';
      params.push(senha);
    }

    query += ' WHERE id = ?';
    params.push(id);

    db.run(query, params, function(err) {
      if (err) {
        console.error('Erro ao atualizar perfil:', err.message, { query, params });
        return res.status(500).json({ error: 'Erro ao atualizar perfil.' });
      }

      if (this.changes === 0) {
        console.log('Nenhuma alteração feita no banco de dados', { id, tabela });
        return res.status(400).json({ error: 'Nenhuma alteração foi feita.' });
      }

      // Busca os dados atualizados para retornar
      db.get(`SELECT * FROM ${tabela} WHERE id = ?`, [id], (err, updatedRow) => {
        if (err) {
          console.error('Erro ao buscar dados atualizados:', err.message);
          return res.status(500).json({ error: 'Erro ao buscar dados atualizados.' });
        }

        res.json({ 
          message: 'Perfil atualizado com sucesso!',
          dados: updatedRow
        });
      });
    });
  });
});

// Rotas de chat
// Listar conversas do usuário ou instituição
app.get('/conversas', (req, res) => {
  const { id, tipo } = req.query;
  if (!id || !tipo) return res.status(400).json({ error: 'Parâmetros obrigatórios.' });
  let query, params;
  if (tipo === 'usuario') {
    query = 'SELECT * FROM conversas WHERE usuario_id = ?';
    params = [id];
  } else {
    query = 'SELECT * FROM conversas WHERE instituicao_id = ?';
    params = [id];
  }
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar conversas.' });
    res.json(rows);
  });
});

// Listar mensagens de uma conversa
app.get('/mensagens', (req, res) => {
  const { conversa_id } = req.query;
  if (!conversa_id) return res.status(400).json({ error: 'Parâmetro obrigatório.' });
  db.all('SELECT * FROM mensagens WHERE conversa_id = ? ORDER BY data ASC', [conversa_id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar mensagens.' });
    res.json(rows);
  });
});

// Enviar mensagem
app.post('/mensagem', (req, res) => {
  const { conversa_id, remetente_id, texto } = req.body;
  if (!conversa_id || !remetente_id || !texto) return res.status(400).json({ error: 'Campos obrigatórios.' });
  const data = new Date().toISOString();
  
  // Primeiro, busca a conversa para saber quem é o destinatário
  db.get('SELECT * FROM conversas WHERE id = ?', [conversa_id], (err, conversa) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar conversa.' });
    if (!conversa) return res.status(404).json({ error: 'Conversa não encontrada.' });

    // Insere a mensagem
    db.run('INSERT INTO mensagens (conversa_id, remetente_id, texto, data) VALUES (?, ?, ?, ?)', 
      [conversa_id, remetente_id, texto, data], 
      function(err) {
        if (err) return res.status(500).json({ error: 'Erro ao enviar mensagem.' });

        // Determina quem é o destinatário
        const destinatario_id = remetente_id === conversa.usuario_id ? conversa.instituicao_id : conversa.usuario_id;
        const destinatario_tipo = remetente_id === conversa.usuario_id ? 'instituicao' : 'usuario';

        // Busca o nome do remetente para a notificação
        const tabela_remetente = remetente_id === conversa.usuario_id ? 'usuario' : 'instituicao';
        db.get(`SELECT nome FROM ${tabela_remetente} WHERE id = ?`, [remetente_id], (err, remetente) => {
          if (err) return res.status(500).json({ error: 'Erro ao buscar dados do remetente.' });

          // Cria a notificação
          const notificacao = {
            titulo: 'Nova mensagem',
            texto: `Nova mensagem de ${remetente.nome}`,
            link: `conversa.html?id=${conversa_id}`,
            data: data
          };

          if (destinatario_tipo === 'usuario') {
            db.run('INSERT INTO notificacoes (usuario_id, titulo, texto, link, data) VALUES (?, ?, ?, ?, ?)',
              [destinatario_id, notificacao.titulo, notificacao.texto, notificacao.link, notificacao.data]);
          } else {
            db.run('INSERT INTO notificacoes (instituicao_id, titulo, texto, link, data) VALUES (?, ?, ?, ?, ?)',
              [destinatario_id, notificacao.titulo, notificacao.texto, notificacao.link, notificacao.data]);
          }

          res.json({ sucesso: true, mensagem_id: this.lastID });
        });
      }
    );
  });
});

// Listar notificações
app.get('/notificacoes', (req, res) => {
  const { id, tipo } = req.query;
  if (!id || !tipo) return res.status(400).json({ error: 'Parâmetros obrigatórios.' });

  const campo = tipo === 'usuario' ? 'usuario_id' : 'instituicao_id';
  db.all(`SELECT * FROM notificacoes WHERE ${campo} = ? ORDER BY data DESC`, [id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar notificações.' });
    res.json(rows);
  });
});

// Marcar notificação como lida
app.post('/notificacao-lida', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'ID da notificação é obrigatório.' });

  db.run('UPDATE notificacoes SET lida = 1 WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: 'Erro ao marcar notificação como lida.' });
    res.json({ sucesso: true });
  });
});

// Criar conversa entre usuário e instituição (se não existir)
app.post('/criar-conversa', (req, res) => {
  const { usuario_id, instituicao_id } = req.body;
  if (!usuario_id || !instituicao_id) return res.status(400).json({ error: 'Campos obrigatórios.' });
  // Verifica se já existe
  db.get('SELECT * FROM conversas WHERE usuario_id = ? AND instituicao_id = ?', [usuario_id, instituicao_id], (err, row) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar conversa.' });
    if (row) return res.json(row); // Já existe
    // Cria nova
    db.run('INSERT INTO conversas (usuario_id, instituicao_id) VALUES (?, ?)', [usuario_id, instituicao_id], function(err2) {
      if (err2) return res.status(500).json({ error: 'Erro ao criar conversa.' });
      db.get('SELECT * FROM conversas WHERE id = ?', [this.lastID], (err3, newRow) => {
        if (err3) return res.status(500).json({ error: 'Erro ao buscar conversa criada.' });
        res.json(newRow);
      });
    });
  });
});

// Rota para buscar dados de um usuário específico
app.get('/usuario/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM usuario WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Erro ao buscar usuário:', err.message);
      return res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json(row);
  });
});

// Rota para buscar dados de uma instituição específica
app.get('/instituicao/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM instituicao WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Erro ao buscar instituição:', err.message);
      return res.status(500).json({ error: 'Erro ao buscar instituição' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Instituição não encontrada' });
    }
    res.json(row);
  });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

app.post('/minha-rota', (req, res) => {
  console.log(req.body); // Aqui sim!
  res.json({ ok: true });
});

app.post('/notificacoes-ler-conversa', (req, res) => {
  const { conversa_id, userId, userType } = req.body;
  if (!conversa_id || !userId || !userType) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }
  let query = '';
  let params = [];
  if (userType === 'usuario') {
    query = 'UPDATE notificacoes SET lida = 1 WHERE usuario_id = ? AND link LIKE ?';
    params = [userId, `%conversa.html?id=${conversa_id}%`];
  } else {
    query = 'UPDATE notificacoes SET lida = 1 WHERE instituicao_id = ? AND link LIKE ?';
    params = [userId, `%conversa.html?id=${conversa_id}%`];
  }
  db.run(query, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true });
  });
});

// Rota para recuperação de senha
app.post('/recuperar-senha', (req, res) => {
    const { email } = req.body;
    
    // Verificar se o email existe em usuários
    db.get('SELECT * FROM usuario WHERE email = ?', [email], (err, usuario) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erro ao verificar email' });
        }
        
        if (usuario) {
            // Email encontrado em usuários
            return res.status(200).json({ message: 'Email encontrado' });
        }
        
        // Se não encontrou em usuários, verifica em instituições
        db.get('SELECT * FROM instituicao WHERE email = ?', [email], (err, instituicao) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Erro ao verificar email' });
            }
            
            if (instituicao) {
                // Email encontrado em instituições
                return res.status(200).json({ message: 'Email encontrado' });
            }
            
            // Email não encontrado em nenhuma tabela
            return res.status(404).json({ error: 'Email não encontrado' });
        });
    });
});

// Rota para recuperar usuário
app.post('/recuperar-usuario', (req, res) => {
    const { email, tipoConta } = req.body;
    
    if (tipoConta === 'usuario') {
        // Buscar CPF do usuário
        db.get('SELECT id FROM usuario WHERE email = ?', [email], (err, usuario) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Erro ao verificar email' });
            }
            
            if (usuario) {
                // Email encontrado em usuários
                return res.status(200).json({ message: 'Email encontrado', id: usuario.id });
            }
            
            // Email não encontrado
            return res.status(404).json({ error: 'Email não encontrado' });
        });
    } else if (tipoConta === 'instituicao') {
        // Buscar CNPJ da instituição
        db.get('SELECT id FROM instituicao WHERE email = ?', [email], (err, instituicao) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Erro ao verificar email' });
            }
            
            if (instituicao) {
                // Email encontrado em instituições
                return res.status(200).json({ message: 'Email encontrado', id: instituicao.id });
            }
            
            // Email não encontrado
            return res.status(404).json({ error: 'Email não encontrado' });
        });
    } else {
        return res.status(400).json({ error: 'Tipo de conta inválido' });
    }
});
