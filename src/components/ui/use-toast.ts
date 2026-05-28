"use client"

import { toast as sonnerToast } from "sonner"

// We export the sonner toast as 'toast' to maintain compatibility 
// with your existing imports across the app.
export const toast = sonnerToast

// Note: Sonner does not use a 'useToast' hook. 
// If you have components relying on it, you should refactor them 
// to use the direct 'toast' import instead.