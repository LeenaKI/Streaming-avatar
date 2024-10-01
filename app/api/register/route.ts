import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { MongoClient, ServerApiVersion } from 'mongodb'

const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB_NAME

if (!uri) {
  throw new Error('Please add your Mongo URI to .env.local')
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

// Function to validate password with required criteria
function isValidPassword(password: string): boolean {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/
  return passwordRegex.test(password)
}

// POST method handler
export async function POST(req: Request) {
  try {
    await client.connect()
    const db = client.db(dbName)
    const collection = db.collection('users')

    const body = await req.json()
    const { name, email, password } = body

    // Check if all fields are provided
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Validate password format
    if (!isValidPassword(password)) {
      return NextResponse.json({
        error: 'Password must be 8-20 characters, include at least one uppercase letter, one lowercase letter, one number, and one special character.',
      }, { status: 400 })
    }

    // Check if the email is already registered
    const existingUser = await collection.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = { name, email, password: hashedPassword }

    // Add the new user to the database
    await collection.insertOne(newUser)

    return NextResponse.json({ message: 'User registered successfully' }, { status: 201 })
  } catch (error: unknown) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}