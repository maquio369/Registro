// routes/auth.js
const express = require('express');
const router = express.Router();

// Importar controladores
const {
  login,
  register,
  getProfile,
  updateProfile,
  changePassword,
  verifyToken
} = require('../controllers/authController');

// Importar middleware
const { verifyToken: authMiddleware, requireAdmin } = require('../middleware/auth');
const { validateLogin, validateUserRegistration } = require('../middleware/validation');

// @route   POST /api/auth/login
// @desc    Iniciar sesión
// @access  Public
router.post('/login', validateLogin, login);

// @route   POST /api/auth/register
// @desc    Registrar nuevo usuario (solo admin)
// @access  Private (Admin)
router.post('/register', authMiddleware, requireAdmin, validateUserRegistration, register);

// @route   GET /api/auth/profile
// @desc    Obtener perfil del usuario actual
// @access  Private
router.get('/profile', authMiddleware, getProfile);

// @route   PUT /api/auth/profile
// @desc    Actualizar perfil del usuario actual
// @access  Private
router.put('/profile', authMiddleware, updateProfile);

// @route   PUT /api/auth/change-password
// @desc    Cambiar contraseña del usuario actual
// @access  Private
router.put('/change-password', authMiddleware, changePassword);

// @route   GET /api/auth/verify
// @desc    Verificar token válido
// @access  Private
router.get('/verify', authMiddleware, verifyToken);

module.exports = router;