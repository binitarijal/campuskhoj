import mongoose from 'mongoose'
import { env } from './env.js'

mongoose.set('strictQuery', true)

export async function connectDatabase() {
  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10_000,
  })
  return mongoose.connection
}

export function databaseIsConnected() {
  return mongoose.connection.readyState === 1
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
  }
}
