const express = require('express');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');

const router = express.Router();

router.use(authenticate);

router.get('/', authorizeRoles('admin'), listUsers);
router.post('/', authorizeRoles('admin'), createUser);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.patch('/:id', updateUser);
router.delete('/:id', authorizeRoles('admin'), deleteUser);

module.exports = router;
