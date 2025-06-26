
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    const { username, password, role } = req.body; 

    if (!username || !password) {
        return res.status(400).json({ message: 'Nome de usuário e senha são obrigatórios.' });
    }

    try {
        const newUser = await User.create(username, password, role);
        res.status(201).json({ message: 'Usuário registrado com sucesso!', user: { id: newUser.id, username: newUser.username, role: newUser.role } });
    } catch (error) {
        if (error.message.includes('Nome de usuário já existe.')) {
            return res.status(409).json({ message: error.message }); 
        }
        res.status(500).json({ message: 'Erro ao registrar usuário.', error: error.message });
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Nome de usuário e senha são obrigatórios.' });
    }

    try {
        const user = await User.findByUsername(username);

        if (!user) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } 
        );

        res.status(200).json({ message: 'Login realizado com sucesso!', token });

    } catch (error) {
        res.status(500).json({ message: 'Erro ao realizar login.', error: error.message });
    }
};