const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const multer = require('multer');
const path = require('path');

const app = express();

// --- Configurações ---
app.use(cors()); 
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Configuração do Multer ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });


// --- Middleware de Autenticação  ---
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) { return next(); } 

  jwt.verify(token, "seuSegredoJWT", (err, user) => {
    if (err) { return next(); } // Token inválido, mas continua
    req.user = user; 
    next();
  });
};

// --- Middleware de Proteção ---
const protect = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) { 
    return res.status(401).json({ error: 'Autenticação necessária.' });
  }

  jwt.verify(token, "seuSegredoJWT", (err, user) => {
    if (err) { 
      return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
    req.user = user; 
    next();
  });
};

// --- Rota de Teste  ---
app.get('/', (req, res) => {
    res.send('API está funcionando!');
});

// --- Rota 1: Cadastro ---
app.post('/register', async (req, res) => {
    const { name, email, password, username } = req.body;
    if (!name || !email || !password || !username) {
        return res.status(400).json({ error: 'Nome, username, email e senha são obrigatórios.' });
    }
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newUser = await pool.query(
            `INSERT INTO users (name, email, password_hash, username) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, name, email, username, course, bio, avatar_url`,
            [name, email, hashedPassword, username.toLowerCase()] // Salva username em minúsculas
        );
        
        res.status(201).json(newUser.rows[0]);
    } catch (err) {
        console.error(err.message);
        if (err.code === '23505') { // Erro de violação de unicidade
            if (err.constraint.includes('email')) {
                return res.status(400).json({ error: 'Email já existe.' });
            }
            if (err.constraint.includes('username')) {
                return res.status(400).json({ error: 'Username já existe.' });
            }
        }
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

app.post('/login', async (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identificador e senha são obrigatórios.' });
    }

    try {
        const userQuery = await pool.query(
          "SELECT * FROM users WHERE email = $1 OR username = $1", 
          [identifier.toLowerCase()] 
        );
        
        if (userQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        const user = userQuery.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!isMatch) {
            return res.status(401).json({ error: 'Senha incorreta' });
        }
        const userPayload = {
          id: user.id, name: user.name, email: user.email,
          course: user.course, bio: user.bio, avatar_url: user.avatar_url,
          username: user.username 
        };
        
        const token = jwt.sign(userPayload, "seuSegredoJWT", { expiresIn: '90d' }); 
        res.json({ token, user: userPayload });
    
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// --- Rota 3: Atualizar Perfil ---
app.put('/profile/:id', verifyToken, async (req, res) => {
    try {
        const profileId = parseInt(req.params.id, 10);
        if (isNaN(profileId)) return res.status(400).json({ error: "ID inválido." });

        // Adiciona 'username'
        const { name, course, bio, username } = req.body; 
        
        if (!req.user || req.user.id !== profileId) {
            return res.status(403).json({ error: 'Acesso negado.' });
        }
        if (!name || !username) {
            return res.status(400).json({ error: 'Nome e username são obrigatórios.' });
        }
        
        const updateQuery = await pool.query(
            `UPDATE users SET name = $1, course = $2, bio = $3, username = $4 
             WHERE id = $5
             RETURNING id, name, email, username, course, bio, avatar_url`, 
            [name, course, bio, username.toLowerCase(), profileId]
        );
        
        if (updateQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        res.status(200).json(updateQuery.rows[0]);
    } catch (err) {
        console.error(err.message);
        if (err.code === '23505' && err.constraint.includes('username')) {
            return res.status(400).json({ error: 'Esse username já está em uso.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// --- Rota 4: UPLOAD DE FOTO DO PERFIL  ---
app.post('/profile/upload-avatar', verifyToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária.' });
    }
    const { id: userId } = req.user;
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }
    
    const fileUrl = `/${req.file.path.replace(/\\/g, '/')}`;

    const updateQuery = await pool.query(
      `UPDATE users SET avatar_url = $1 WHERE id = $2
       RETURNING id, name, email, username, course, bio, avatar_url`, // Adicionado username ao returning
      [fileUrl, userId]
    );
    if (updateQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    res.status(200).json(updateQuery.rows[0]);
  } catch (err) {
    console.error("Erro no upload do avatar:", err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});


// --- Rota 5: CRIAR UM NOVO POST  ---
app.post('/posts', verifyToken, upload.single('postImage'), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária.' });
    }
    const { id: userId } = req.user;
    const { content } = req.body;
    let imageUrl = null; 
    if (!content && !req.file) {
      return res.status(400).json({ error: 'O post não pode estar vazio.' });
    }
    if (req.file) {
      imageUrl = `/${req.file.path.replace(/\\/g, '/')}`;
    }
    const newPost = await pool.query(
      `INSERT INTO posts (user_id, content, image_url) VALUES ($1, $2, $3) RETURNING *`,
      [userId, content, imageUrl]
    );
    res.status(201).json(newPost.rows[0]);
  } catch (err) {
    console.error("Erro ao criar post:", err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});


// --- Rota 6: BUSCAR TODOS OS POSTS (FEED "PARA VOCÊ") ---
app.get('/posts', verifyToken, async (req, res) => {
  try {
    const myUserId = req.user ? req.user.id : 0;
    const feedQuery = await pool.query(
      `SELECT 
          posts.id, 
          posts.content, 
          posts.image_url, 
          posts.created_at, 
          users.name AS author_name, 
          users.avatar_url AS author_avatar,
          users.course AS author_course,
          users.username AS author_username, -- <-- ADICIONADO AQUI
          
          (SELECT COUNT(*) FROM post_likes WHERE post_id = posts.id) AS total_likes,
          EXISTS (
            SELECT 1 FROM post_likes 
            WHERE post_id = posts.id AND user_id = $1
          ) AS liked_by_me,
          (SELECT COUNT(*) FROM comments WHERE post_id = posts.id) AS total_comments
          
        FROM posts
        JOIN users ON posts.user_id = users.id
        ORDER BY posts.created_at DESC
        LIMIT 20`, // LIMIT para não sobrecarregar
      [myUserId]
    );
    res.status(200).json(feedQuery.rows);
  } catch (err) {
    console.error("Erro ao buscar posts:", err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});


// --- Rota 7: BUSCAR POSTS DE UM USUÁRIO ESPECÍFICO ---
app.get('/posts/user/:username', verifyToken, async (req, res) => {
  try {
    const { username } = req.params;
    const myUserId = req.user ? req.user.id : 0;

    const userQuery = await pool.query("SELECT id FROM users WHERE username = $1", [username]);
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }
    const profileUserId = userQuery.rows[0].id;
    
    const feedQuery = await pool.query(
      `SELECT 
          posts.id, 
          posts.content, 
          posts.image_url, 
          posts.created_at, 
          users.name AS author_name, 
          users.avatar_url AS author_avatar,
          users.course AS author_course,
          users.username AS author_username, -- <-- ADICIONADO AQUI
          
          (SELECT COUNT(*) FROM post_likes WHERE post_id = posts.id) AS total_likes,
          EXISTS (
            SELECT 1 FROM post_likes 
            WHERE post_id = posts.id AND user_id = $1
          ) AS liked_by_me,
          (SELECT COUNT(*) FROM comments WHERE post_id = posts.id) AS total_comments

        FROM posts
        JOIN users ON posts.user_id = users.id
        WHERE posts.user_id = $2 -- Usando o ID que encontramos
        ORDER BY posts.created_at DESC`,
      [myUserId, profileUserId]
    );
    res.status(200).json(feedQuery.rows);
  } catch (err) {
    console.error("Erro ao buscar posts do usuário:", err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});


// --- Rota 8: DELETAR UM POST  ---
app.delete('/posts/:id', verifyToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária.' });
    }
    const postId = parseInt(req.params.id, 10);
    if (isNaN(postId)) return res.status(400).json({ error: "ID inválido." });
    
    const { id: userId } = req.user;
    const deleteQuery = await pool.query(
      "DELETE FROM posts WHERE id = $1 AND user_id = $2", 
      [postId, userId]
    );
    if (deleteQuery.rowCount === 0) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }
    res.status(204).send();
  } catch (err) {
    console.error("Erro ao deletar post:", err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});


// --- Rota 9: CURTIR/DESCURTIR  ---
app.post('/posts/:id/toggle-like', verifyToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Autenticação necessária.' });
  }
  const postId = parseInt(req.params.id, 10);
  if (isNaN(postId)) return res.status(400).json({ error: "ID inválido." });
  
  const { id: userId } = req.user;
  try {
    const likeQuery = await pool.query(
      "SELECT * FROM post_likes WHERE user_id = $1 AND post_id = $2",
      [userId, postId]
    );
    if (likeQuery.rows.length > 0) {
      await pool.query(
        "DELETE FROM post_likes WHERE user_id = $1 AND post_id = $2",
        [userId, postId]
      );
      res.status(200).json({ liked: false });
    } else {
      await pool.query(
        "INSERT INTO post_likes (user_id, post_id) VALUES ($1, $2)",
        [userId, postId]
      );
      
      try {
        await pool.query(
          `INSERT INTO notifications (recipient_id, sender_id, post_id, type)
           SELECT user_id, $1, $2, 'like'
           FROM posts
           WHERE id = $2 AND user_id != $1`,
          [userId, postId]
        );
      } catch (err) {
        console.error("Erro ao criar notificação de like:", err.message);
      }
      
      res.status(200).json({ liked: true });
    }
  } catch (err) {
    if (err.code === '23505') {
        return res.status(409).json({ error: 'Conflito, tente novamente.' });
    }
    console.error("Erro no toggle-like:", err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});


// --- Rota 10: LER comentários  ---
app.get('/posts/:id/comments', verifyToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Autenticação necessária.' });
  }
  try {
    const postId = parseInt(req.params.id, 10);
    if (isNaN(postId)) return res.status(400).json({ error: "ID inválido." });

    const commentsQuery = await pool.query(
      `SELECT
          comments.id, comments.content, comments.created_at,
          users.name AS author_name, users.avatar_url AS author_avatar,
          users.username AS author_username -- <-- ADICIONADO AQUI
        FROM comments
        JOIN users ON comments.user_id = users.id
        WHERE comments.post_id = $1
        ORDER BY comments.created_at ASC`,
      [postId]
    );
    res.status(200).json(commentsQuery.rows);
  } catch (err) {
    console.error("Erro ao buscar comentários:", err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});


// --- Rota 11: CRIAR comentário  ---
app.post('/posts/:id/comments', verifyToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Autenticação necessária.' });
  }
  try {
    const postId = parseInt(req.params.id, 10);
    if (isNaN(postId)) return res.status(400).json({ error: "ID inválido." });
    
    const { content } = req.body;
    const { id: userId, name: authorName, avatar_url: authorAvatar, username: authorUsername } = req.user;

    if (!content) {
      return res.status(400).json({ error: 'O comentário não pode estar vazio.' });
    }
    const newComment = await pool.query(
      `INSERT INTO comments (user_id, post_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, content, created_at`,
      [userId, postId, content]
    );

    try {
      await pool.query(
        `INSERT INTO notifications (recipient_id, sender_id, post_id, type)
         SELECT user_id, $1, $2, 'comment'
         FROM posts
         WHERE id = $2 AND user_id != $1`,
        [userId, postId] 
      );
    } catch (err) {
      console.error("Erro ao criar notificação de comment:", err.message);
    }
    
    const commentWithAuthor = {
      id: newComment.rows[0].id,
      content: newComment.rows[0].content,
      created_at: newComment.rows[0].created_at,
      author_name: authorName,
      author_avatar: authorAvatar,
      author_username: authorUsername 
    };
    res.status(201).json(commentWithAuthor);
  } catch (err) {
    console.error("Erro ao criar comentário:", err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});


// --- Rota 12: BUSCAR Notificações  ---
/*{app.get('/notifications', verifyToken, async (req, res) => {
  // ... (código original sem mudança)
  if (!req.user) {
    return res.status(401).json({ error: 'Autenticação necessária.' });
  }
  try {
    const { id: myUserId } = req.user;
    const notificationsQuery = await pool.query(
      `SELECT
          n.id, n.type, n.post_id, n.read, n.created_at,
          u.name AS sender_name, u.avatar_url AS sender_avatar,
          u.username AS sender_username -- <-- ADICIONADO AQUI
        FROM notifications AS n
        JOIN users AS u ON n.sender_id = u.id
        WHERE n.recipient_id = $1
        ORDER BY n.created_at DESC`,
      [myUserId]
    );
    res.status(200).json(notificationsQuery.rows);
  } catch (err) {
    console.error("Erro ao buscar notificações:", err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});}*/


// ==========================================================
// --- SISTEMA DE SEGUIDORES ---
// ==========================================================

// --- Rota 13: FEED "SEGUINDO" ---
app.get('/feed/following', verifyToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Autenticação necessária.' });
  }
  
  const myUserId = req.user.id;
  
  try {
    const feedQuery = await pool.query(
      `SELECT 
          posts.id, 
          posts.content, 
          posts.image_url, 
          posts.created_at, 
          users.name AS author_name, 
          users.avatar_url AS author_avatar,
          users.course AS author_course,
          users.username AS author_username,
          
          (SELECT COUNT(*) FROM post_likes WHERE post_id = posts.id) AS total_likes,
          EXISTS (
            SELECT 1 FROM post_likes 
            WHERE post_id = posts.id AND user_id = $1
          ) AS liked_by_me,
          (SELECT COUNT(*) FROM comments WHERE post_id = posts.id) AS total_comments
          
        FROM posts
        JOIN users ON posts.user_id = users.id
        -- A MÁGICA ESTÁ AQUI:
        JOIN follows ON posts.user_id = follows.following_id
        WHERE follows.follower_id = $1 -- Onde EU sou o seguidor
        ORDER BY posts.created_at DESC
        LIMIT 20`,
      [myUserId]
    );
    res.status(200).json(feedQuery.rows);
  } catch (err) {
    console.error("Erro ao buscar feed 'seguindo':", err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// --- Rota 14: VER PERFIL DE UM USUÁRIO ---
app.get('/profile/:username', verifyToken, async (req, res) => {
  const { username } = req.params;
  const myUserId = req.user ? req.user.id : 0; 
  
  try {
    const profileQuery = await pool.query(
      `SELECT
          id, name, username, course, bio, avatar_url,
          (SELECT COUNT(*) FROM follows WHERE following_id = users.id) AS followers_count,
          (SELECT COUNT(*) FROM follows WHERE follower_id = users.id) AS following_count,
          EXISTS (
              SELECT 1 FROM follows
              WHERE follower_id = $1 AND following_id = users.id
          ) AS is_following_by_me
        FROM users
        WHERE username = $2`,
      [myUserId, username]
    );

    if (profileQuery.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }
    
    res.status(200).json(profileQuery.rows[0]);
  } catch (err) {
    console.error("Erro ao buscar perfil:", err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});


// --- Rota 15: SEGUIR UM USUÁRIO ---
app.post('/users/:username/follow', verifyToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Autenticação necessária.' });
  }
  
  const { username: userToFollow } = req.params;
  const { id: myUserId } = req.user;
  
  try {
    const userQuery = await pool.query("SELECT id FROM users WHERE username = $1", [userToFollow]);
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: "Usuário a seguir não encontrado." });
    }
    const followingId = userQuery.rows[0].id;
    
    if (followingId === myUserId) {
      return res.status(400).json({ error: "Você não pode seguir a si mesmo." });
    }

    await pool.query(
      "INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)",
      [myUserId, followingId]
    );

    try {
        await pool.query(
          `INSERT INTO notifications (recipient_id, sender_id, type)
           VALUES ($1, $2, 'follow')`,
          [followingId, myUserId] 
        );
      } catch (err) {
        console.error("Erro ao criar notificação de follow:", err.message);
      }

    res.status(200).json({ following: true });
    
  } catch (err) {
    if (err.code === '23505') { // Já segue
      return res.status(409).json({ error: 'Você já segue este usuário.' });
    }
    console.error("Erro ao seguir usuário:", err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// --- Rota 16: DEIXAR DE SEGUIR UM USUÁRIO ---
app.delete('/users/:username/unfollow', verifyToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Autenticação necessária.' });
  }
  
  const { username: userToUnfollow } = req.params;
  const { id: myUserId } = req.user;
  
  try {
    const userQuery = await pool.query("SELECT id FROM users WHERE username = $1", [userToUnfollow]);
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }
    const followingId = userQuery.rows[0].id;

    const deleteQuery = await pool.query(
      "DELETE FROM follows WHERE follower_id = $1 AND following_id = $2",
      [myUserId, followingId]
    );
    
    if (deleteQuery.rowCount === 0) {
      return res.status(400).json({ error: "Você não seguia este usuário." });
    }

    res.status(200).json({ following: false });
    
  } catch (err) {
    console.error("Erro ao deixar de seguir:", err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});


// --- Rota 17: BUSCA DE USUÁRIOS ---
app.get('/search/users', verifyToken, async (req, res) => {
  const { q } = req.query; 
  const myUserId = req.user ? req.user.id : 0;
  
  if (!q) {
    return res.status(200).json([]); 
  }
  
  try {
    const searchQuery = await pool.query(
      `SELECT
          id, name, username, avatar_url,
          EXISTS (
              SELECT 1 FROM follows
              WHERE follower_id = $1 AND following_id = users.id
          ) AS is_following_by_me
        FROM users
        WHERE (username ILIKE $2 OR name ILIKE $2) -- ILIKE é case-insensitive
        AND id != $1 -- Não me incluir nos resultados
        LIMIT 10`,
      [myUserId, `%${q}%`] // %q% busca por qualquer parte da string
    );
    
    res.status(200).json(searchQuery.rows);
    
  } catch (err) {
    console.error("Erro ao buscar usuários:", err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});


// --- Rota 18: BUSCAR PERFIL POR ID (para o "Meu Perfil") ---
app.get('/profile/id/:id', verifyToken, async (req, res) => {
  const profileId = parseInt(req.params.id, 10);
  if (isNaN(profileId)) return res.status(400).json({ error: "ID inválido." });

  const myUserId = req.user ? req.user.id : 0; 
  
  try {
    const profileQuery = await pool.query(
      `SELECT
          id, name, username, course, bio, avatar_url,
          (SELECT COUNT(*) FROM follows WHERE following_id = users.id) AS followers_count,
          (SELECT COUNT(*) FROM follows WHERE follower_id = users.id) AS following_count,
          EXISTS (
              SELECT 1 FROM follows
              WHERE follower_id = $1 AND following_id = users.id
          ) AS is_following_by_me
        FROM users
        WHERE id = $2`,
      [myUserId, profileId]
    );

    if (profileQuery.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }
    res.status(200).json(profileQuery.rows[0]);
  } catch (err) {
    console.error("Erro ao buscar perfil por ID:", err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// --- Rota 19: BUSCAR POSTS POR ID (para o "Meu Perfil") ---
app.get('/posts/user/id/:id', verifyToken, async (req, res) => {
  try {
    const profileUserId = parseInt(req.params.id, 10);
    if (isNaN(profileUserId)) return res.status(400).json({ error: "ID inválido." });

    const myUserId = req.user ? req.user.id : 0;
    
    // A query é a mesma da Rota 7, só muda como pegamos o ID
    const feedQuery = await pool.query(
      `SELECT 
          posts.id, posts.content, posts.image_url, posts.created_at, 
          users.name AS author_name, users.avatar_url AS author_avatar,
          users.course AS author_course, users.username AS author_username,
          (SELECT COUNT(*) FROM post_likes WHERE post_id = posts.id) AS total_likes,
          EXISTS (
            SELECT 1 FROM post_likes 
            WHERE post_id = posts.id AND user_id = $1
          ) AS liked_by_me,
          (SELECT COUNT(*) FROM comments WHERE post_id = posts.id) AS total_comments
        FROM posts
        JOIN users ON posts.user_id = users.id
        WHERE posts.user_id = $2
        ORDER BY posts.created_at DESC`,
      [myUserId, profileUserId]
    );
    res.status(200).json(feedQuery.rows);
  } catch (err) {
    console.error("Erro ao buscar posts do usuário por ID:", err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// ==========================================================
// --- SISTEMA DE QUADRO DE AVISOS (COMUNIDADES) ---
// ==========================================================

// --- Rota 20: CRIAR UM QUADRO DE AVISOS (Ferramenta Admin/Dev) ---
app.post('/boards', verifyToken, async (req, res) => {
  // verificar se o usuário é admin.
  const { name, description, slug } = req.body;
  
  try {
    const newBoard = await pool.query(
      `INSERT INTO notice_boards (name, description, slug) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [name, description, slug]
    );
    res.status(201).json(newBoard.rows[0]);
  } catch (err) {
    console.error("Erro ao criar quadro:", err.message);
    res.status(500).json({ error: 'Erro ao criar quadro.' });
  }
});

// --- Rota 21: LISTAR TODOS OS QUADROS  ---
app.get('/boards', verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const boards = await pool.query(
      `SELECT 
         nb.*,
         (SELECT COUNT(*) FROM board_members WHERE board_id = nb.id) as member_count,
         EXISTS (
           SELECT 1 FROM board_members 
           WHERE board_id = nb.id AND user_id = $1
         ) as is_member
        FROM notice_boards nb
        ORDER BY nb.name ASC`,
      [userId]
    );
    res.status(200).json(boards.rows);
  } catch (err) {
    console.error("Erro ao buscar quadros:", err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// --- Rota 22: ENTRAR/SAIR DE UM QUADRO  ---
app.post('/boards/:id/toggle-join', verifyToken, async (req, res) => {
  const boardId = req.params.id; // UUID (String)
  const userId = req.user.id;

  try {
    // Verifica se já é membro
    const checkMember = await pool.query(
      "SELECT * FROM board_members WHERE user_id = $1 AND board_id = $2",
      [userId, boardId]
    );

    if (checkMember.rows.length > 0) {
      // Se já é membro, SAI (Delete)
      await pool.query(
        "DELETE FROM board_members WHERE user_id = $1 AND board_id = $2",
        [userId, boardId]
      );
      res.status(200).json({ joined: false });
    } else {
      // Se não é membro, ENTRA (Insert)
      await pool.query(
        "INSERT INTO board_members (user_id, board_id) VALUES ($1, $2)",
        [userId, boardId]
      );
      res.status(200).json({ joined: true });
    }
  } catch (err) {
    console.error("Erro ao entrar/sair do quadro:", err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// --- Rota 23: POSTAR UM AVISO ---
// Aceita imagem ou PDF. O campo no form-data deve ser 'file'
app.post('/boards/:id/notices', verifyToken, upload.single('file'), async (req, res) => {
  const boardId = req.params.id;
  const userId = req.user.id;

  const { subject, content } = req.body; 
  
  if (!content) {
    return res.status(400).json({ error: 'O conteúdo do aviso é obrigatório.' });
  }

  let fileUrl = null;
  let fileType = null;

  if (req.file) {
    // Caminho do arquivo
    fileUrl = `/${req.file.path.replace(/\\/g, '/')}`;
    
    // Detectar se é PDF ou Imagem
    if (req.file.mimetype === 'application/pdf') {
      fileType = 'pdf';
    } else if (req.file.mimetype.startsWith('image/')) {
      fileType = 'image';
    } else {
      fileType = 'other';
    }
  }

  try {
    const newNotice = await pool.query(
      `INSERT INTO notices (board_id, user_id, subject, content, file_url, file_type) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [boardId, userId, subject || 'Geral', content, fileUrl, fileType]
    );

    res.status(201).json(newNotice.rows[0]);

  } catch (err) {
    console.error("Erro ao postar aviso:", err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// --- Rota 24: FEED DE AVISOS (Meus Quadros) ---
// Pega avisos apenas dos quadros que eu entrei
app.get('/notices/feed', verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const feedQuery = await pool.query(
      `SELECT 
         n.id, n.subject, n.content, n.file_url, n.file_type, n.created_at,
         nb.name as board_name,
         u.name as author_name, u.avatar_url as author_avatar,
         n.user_id as author_id  -- <-- ADICIONE ESTA LINHA
        FROM notices n
        JOIN notice_boards nb ON n.board_id = nb.id
        JOIN users u ON n.user_id = u.id
        JOIN board_members bm ON nb.id = bm.board_id
        WHERE bm.user_id = $1
        ORDER BY n.created_at DESC
        LIMIT 50`,
      [userId]
    );

    res.status(200).json(feedQuery.rows);
  } catch (err) {
    console.error("Erro ao buscar feed de avisos:", err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// ==========================================================
// --- EDIÇÃO E DELEÇÃO DE AVISOS ---
// ==========================================================

// --- Rota 25: DELETAR UM AVISO ---
app.delete('/notices/:id', verifyToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Autenticação necessária.' });
  }
  
  const noticeId = req.params.id; // UUID (String)
  const userId = req.user.id;

  try {
    // A query só vai apagar o aviso SE o ID do aviso E o ID do usuário baterem
    const deleteQuery = await pool.query(
      "DELETE FROM notices WHERE id = $1 AND user_id = $2",
      [noticeId, userId]
    );

    // Se deleteQuery.rowCount for 0, significa que ou o post não existe
    // ou o usuário não era o dono.
    if (deleteQuery.rowCount === 0) {
      return res.status(403).json({ error: 'Acesso negado. Você não é o dono deste aviso.' });
    }

    res.status(204).send(); // 204 = Sucesso, sem conteúdo

  } catch (err) {
    console.error("Erro ao deletar aviso:", err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// --- Rota 26: EDITAR UM AVISO ---
// Versão simples, só edita texto. 
app.put('/notices/:id', verifyToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Autenticação necessária.' });
  }

  const noticeId = req.params.id;
  const userId = req.user.id;
  const { subject, content } = req.body; // Pega os novos textos

  if (!content) {
    return res.status(400).json({ error: 'O conteúdo não pode ficar vazio.' });
  }

  try {
    const updateQuery = await pool.query(
      `UPDATE notices 
       SET subject = $1, content = $2 
       WHERE id = $3 AND user_id = $4
       RETURNING *`, // RETURNING * nos devolve o post atualizado
      [subject || 'Geral', content, noticeId, userId]
    );

    if (updateQuery.rows.length === 0) {
      return res.status(403).json({ error: 'Acesso negado. Você não é o dono deste aviso.' });
    }

    res.status(200).json(updateQuery.rows[0]); // Devolve o aviso atualizado

  } catch (err) {
    console.error("Erro ao editar aviso:", err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// --- Rota 27: BUSCA DE QUADROS ---
app.get('/search/boards', verifyToken, async (req, res) => {
  const { q } = req.query; // A query de busca (ex: "engenharia")
  const myUserId = req.user ? req.user.id : 0; // Pega o ID do usuário logado

  if (!q) {
    return res.status(200).json([]); // Retorna vazio se a busca for vazia
  }

  try {
    const searchQuery = await pool.query(
      `SELECT
         nb.id, nb.name, nb.slug, nb.description,
         (SELECT COUNT(*) FROM board_members WHERE board_id = nb.id) as member_count,
         EXISTS (
             SELECT 1 FROM board_members
             WHERE board_id = nb.id AND user_id = $1
         ) as is_member
        FROM notice_boards nb
        WHERE (nb.name ILIKE $2 OR nb.description ILIKE $2 OR nb.slug ILIKE $2)
        LIMIT 10`,
      [myUserId, `%${q}%`] // $1 é o myUserId, $2 é a query de busca
    );
    
    res.status(200).json(searchQuery.rows);

  } catch (err) {
    console.error("Erro ao buscar quadros:", err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});


// ==========================================================
// --- ROTAS DO CALENDÁRIO  ---
// ==========================================================

app.post('/events', protect, async (req, res) => {
  // O 'protect' GARANTE que 'req.user' existe.
  const { title, description, start_time, end_time } = req.body;
  const userId = req.user.id; 

  try {
    const newEvent = await pool.query(
      `INSERT INTO events (title, description, start_time, end_time, category, user_id)
       VALUES ($1, $2, $3, $4, 'USER_PRIVATE', $5)
       RETURNING *`,
      [title, description, start_time, end_time, userId]
    );
    res.status(201).json(newEvent.rows[0]);
  } catch (err) {
    console.error("Erro ao criar evento:", err.message);
    res.status(500).json({ error: 'Erro ao criar evento' });
  }
});

/// --- Rota 29: BUSCAR EVENTOS (GET /events) ---
app.get('/events', async (req, res) => {
  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json({ error: 'Mês e ano são obrigatórios' });
  }

  try {
    const events = await pool.query(
      `SELECT * FROM events
       WHERE
         EXTRACT(MONTH FROM start_time) = $1 AND
         EXTRACT(YEAR FROM start_time) = $2
       AND
         category IN ('ACADEMIC', 'CAMPUS')
       ORDER BY start_time ASC`,
      [month, year] // O $3 (userId) foi removido
    );
    
    res.status(200).json(events.rows);
    
  } catch (err) {
    console.error("Erro ao buscar eventos públicos:", err.message);
    res.status(500).json({ error: 'Erro ao buscar eventos' });
  }
});

// ==========================================================
// --- Thunder Client ---
// ==========================================================
// Ela permite criar eventos ACADEMIC sem login.

app.post('/temp/create-academic-event', async (req, res) => {
  const { title, description, start_time, end_time } = req.body;

  // Validação simples
  if (!title || !start_time || !end_time) {
    return res.status(400).json({ error: "Título, start_time e end_time são obrigatórios" });
  }

  try {
    const newEvent = await pool.query(
      `INSERT INTO events (title, description, start_time, end_time, category, user_id)
       VALUES ($1, $2, $3, $4, 'ACADEMIC', NULL)
       RETURNING *`,
      [title, description, start_time, end_time]
    );
    // 201 = Created
    res.status(201).json(newEvent.rows[0]); 

  } catch (err) {
    console.error("Erro ao criar evento de teste:", err.message);
    res.status(500).json({ error: 'Erro ao criar evento' });
  }
});


const PORT = 3000;

// --- Iniciar o Servidor ---
app.listen(PORT, '0.0.0.0', () => { 
    console.log(`Servidor rodando em http://0.0.0.0:${PORT}`); 
});