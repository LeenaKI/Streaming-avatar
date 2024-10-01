import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { MongoClient, ServerApiVersion } from 'mongodb'

const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB_NAME
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY

if (!uri) {
  throw new Error('Please add your Mongo URI to .env.local')
}

if (!JWT_SECRET_KEY) {
  throw new Error('Please add your JWT secret key to .env.local')
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
})

type User = {
  name: string
  email: string
  password: string
}

// Function to validate email using regex
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// POST method handler
export async function POST(req: Request) {
  try {
    await client.connect()
    const db = client.db(dbName)
    const collection = db.collection('users')

    const body = await req.json()
    const { email, password } = body

    // Validate email and password fields
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Find the user with the provided email
    const user = await collection.findOne({ email }) as User | null

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Compare the provided password with the stored hashed password
    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Generate a JWT token
    const token = jwt.sign(
      {
        name: user.name,
        email: user.email,
      },
      "your_secret_key",
      { expiresIn: '1h' } // Token expires in 1 hour
    )

    // Return the JWT token in the response
    return NextResponse.json({
      message: 'Login successful',
      data: {
        name: user.name,
        email: user.email
      },
      token,
    })
  } catch (error: unknown) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}