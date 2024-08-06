const express = require('express');
const router = express.Router();
const {Pergunta, Resposta} = require('../database/models/PerguntasRespostas');
const Usuario = require('../database/models/Usuario');

router.post("/validarlogin",(req,res)=>{
    //var user = req.body.usuario;
    //var senha = req.body.senha;
});

router.post("/perguntar", async (req, res) => {
  try {
    const { nome, email, pergunta, categoria, descricao } = req.body;

    // Verifica se todos os dados necessários estão presentes
    if (!pergunta || !categoria) {
      return res.status(400).json({ error: 'Pergunta e categoria são obrigatórios.' });
    }

    if (!nome || !email) {
      return res.status(400).json({ error: 'Nome e e-mail são obrigatórios para criar um novo usuário.' });
    }
    // Salva o Usuário
    let usuario = await Usuario.create({ nome, email });

    // Cria e salva a nova pergunta
    const novaPergunta = await Pergunta.create({
      usuario_id: usuario.id,
      pergunta,
      categoria,
      descricao
    });

    res.status(201).json(novaPergunta);
  } catch (error) {
    console.error('Erro ao salvar pergunta:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

router.post("/responder", async (req, res) => {
  try {
    const { nome, email, resposta, pergunta_id } = req.body;

    // Verifica se todos os dados necessários estão presentes
    if (!pergunta_id || !resposta) {
      return res.status(400).json({ error: 'Resposta é obrigatória.' });
    }

    if (!nome || !email) {
      return res.status(400).json({ error: 'Nome e e-mail são obrigatórios para criar um novo usuário.' });
    }
    
    // Salva o Usuário
    let usuario = await Usuario.create({ nome, email });

    // Cria e salva a nova resposta
    const novaResposta = await Resposta.create({
      usuario_id: usuario.id,
      resposta,
      pergunta_id,
      likes: 0,
      dislikes: 0,
    });

    res.status(201).json(novaResposta);
  } catch (error) {
    console.error('Erro ao salvar pergunta:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

router.post("/votar", async (req, res) => {
  const { nome, email, voto, resposta_id } = req.body;

  // Verifica se todos os dados necessários estão presentes
  if (!resposta_id || !voto) {
    return res.status(400).json({ error: 'Voto é obrigatório.' });
  }

  if (!nome || !email) {
    return res.status(400).json({ error: 'Nome e e-mail são obrigatórios para criar um novo usuário.' });
  }
  // Salva o Usuário
  await Usuario.create({ nome, email });
  
  const resposta = await Resposta.findByPk(resposta_id);

  // Faz o voto
  if (!resposta) {
    return res.status(404).json({ error: 'Resposta não encontrada.' });
  } else {
    if (voto === 'like') {
      resposta.likes += 1;
    } else if (voto === 'dislike') {
      resposta.dislikes += 1;
    } else {
      return res.status(400).json({ error: 'Voto inválido.' });
    }

    await resposta.save();
    res.json(resposta);
  }

});

router.get("/perguntas", async (req, res) => {
  const { categoria } = req.query;

  // Configurações para a consulta
  let whereClause = {};

  // Adiciona condição ao whereClause se categoria for fornecida
  if (categoria) {
    whereClause.categoria = categoria;
  }

  try {
    // Buscar perguntas com condições dinâmicas
    const perguntas = await Pergunta.findAll({
      where: Object.keys(whereClause).length ? whereClause : undefined, // Se não houver condições, omitir where
      include: [
        {
          model: Resposta,
          as: 'respostas',
        }
      ]
    });

    res.render("index", {perguntas, perguntas});
  } catch (error) {
    console.error('Erro ao buscar perguntas:', error);
    res.status(500).json({ error: 'Erro ao buscar perguntas' });
  }
});

router.get("/pergunta/:id", async (req, res) => {
  const id = req.params.id;
  const { ordem } = req.query;

  // Configurações para a consulta
  let orderClause = [['likes', 'DESC']]; // Ordem padrão

  // Adiciona condição ao orderClause se ordem for fornecida
  if (ordem) {
    orderClause = [['likes', ordem]]; // Ordena as respostas pela coluna 'likes' de acordo com o valor de ordem (ASC ou DESC)
  }

  try {
    // Buscar perguntas com condições dinâmicas
    const pergunta = await Pergunta.findOne({
      where: { id: id },
      include: [
        {
          model: Resposta,
          as: 'respostas',
          include: [
            {
              model: Usuario,
              as: 'usuarios', // Alias da associação com Usuario
              attributes: ['nome'] // Selecionando apenas o campo nome do usuário
            }
          ]
        }
      ],
      order: [
        [{ model: Resposta, as: 'respostas' }, 'likes', orderClause[0][1]]
      ] // Ordena as respostas por 'likes' de acordo com o valor de orderClause
    });

    res.render("pergunta", { pergunta });
  } catch (error) {
    console.error(`Erro ao buscar pergunta ${id}:`, error);
    res.status(500).json({ error: `Erro ao buscar pergunta ${id}` });
  }
});

module.exports = router;