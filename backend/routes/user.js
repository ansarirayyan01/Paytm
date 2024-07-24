const express = require('express')
const router = express.router()
const zod = require('zod')
const { User, Account } = require('../db')
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware');
const JWT_SECRET = require('../config');



const signupSchema = zod.object({
    username: zod.string(),
    password: zod.string(),
    firstName: zod.string(),
    lastName: zod.string(),
})
router.post('/signup', async (req, res) => {
    const body = req.body
    const { success } = signupSchema.safeParse(req.body)
    if (!success) {
        res.json({
            message: "User already signed up / Invalid credentials"
        })
    }

    const existingUser = User.findOne({
        username: body.username
    })
    if (existingUser) {
        res.json({
            message: "User already signed up / Invalid credentials"
        })
    }

    const user = await User.create({
        username: req.body.username,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
    })
    const userId = user._id;

    await Account.create({
        userId,
        balance: 1 + Math.random() * 10000
    })

    const token = jwt.sign({
        userId
    }, JWT_SECRET)

    res.json({
        message: "User signed up successfully",
        token
    })
})

const loginSchema = zod.object({
    username: zod.string().email(),
    password: zod.string(),
})

router.post('/signin', async (req, res) => {
    const body = req.body
    const { success } = loginSchema.safeParse(req.body)
    if (!success) {
        res.json({
            message: "Invalid credentials"
        })
    }
    const user = await User.findOne({
        username: body.username,
        password: body.password,
    })
    if (user) {
        const token = jwt.sign({
         userId: user._id
        }, JWT_SECRET)

        res.json({
            message: "Logged in successfully",
            token: token
        })
    }
    
    
})

const updateBody = zod.object({
    firstName: zod.string().optional(),
    lastName: zod.string().optional(),
    password: zod.string().optional(),
})

router.put('/', authMiddleware, async (req, res) => {
    const {success} = updateBody.safeParse(req.body)
    if (!success) {
        return res.status(400).json({ message: 'Invalid request' })
    }
    await User.updateOne(req.body, {
        id: req.userId
    })
    res.json({ message: 'User updated successfully' })

})

router.get('/bulk', authMiddleware, async (req, res) => {
    const filter = req.query.filter || ""

    const users = await User.find({
        $or: [{
            firstName: {
                '$regex': filter,
            },
            lastName: {
                '$regex': filter,
            }
        }]
    })

    res.json({
        user: users.map(user => ({
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
        }))
    })
})

module.exports = router