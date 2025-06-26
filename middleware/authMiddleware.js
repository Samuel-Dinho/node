
const jwt = require('jsonwebtoken');

exports.authenticateToken = (req, res, next) => {
    
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (token == null) {
        return res.status(401).json({ message: 'Token não fornecido.' }); 
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Erro na verificação do token:', err);
            
            if (err.name === 'TokenExpiredError') {
                return res.status(403).json({ message: 'Token expirado.' }); 
            }
            return res.status(403).json({ message: 'Token inválido.' }); 
        }
        req.user = user; 
        next(); 
    });
};

exports.authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: 'Acesso negado. Informações de role ausentes.' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Acesso negado. Você não tem permissão para esta ação.' });
        }
        next();
    };
};