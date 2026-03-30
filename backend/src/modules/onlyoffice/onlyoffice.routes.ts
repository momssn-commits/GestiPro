import { Router } from 'express'
import { authenticate } from '../../middleware/auth'
import { getEditorConfig, onlyofficeCallback } from './onlyoffice.controller'

const router = Router()

// Config pour ouvrir l'éditeur (authentifié)
router.get('/editor-config/:id', authenticate, getEditorConfig)

// Callback OnlyOffice — appelé par le serveur OnlyOffice lors de la sauvegarde
// Pas d'authentification JWT car c'est un appel machine-à-machine
router.post('/callback', onlyofficeCallback)

export default router
