"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { Alert, AlertDescription } from "../../components/ui/alert"
import { Loader2, AlertCircle } from "lucide-react"

const Login = () => {
  const [license, setLicense] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loginAttempts, setLoginAttempts] = useState(0)
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Get the redirect path from location state or default to home
  const from = location.state?.from?.pathname || "/"

  useEffect(() => {
    // Redirect if already authenticated
    if (user) {
      navigate(from, { replace: true })
    }
  }, [user, navigate, from])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Validate input
      if (!license.trim()) {
        setError("Please enter your license")
        setIsLoading(false)
        return
      }

      if (!password) {
        setError("Please enter your password")
        setIsLoading(false)
        return
      }

      const result = await login(license, password)

      // Check if result exists and has success property
      if (result && result.success) {
        navigate(from, { replace: true })
      } else {
        setError("Login failed. Please check your credentials and try again.")
        setLoginAttempts((prev) => prev + 1)
      }
    } catch (err) {
      setLoginAttempts((prev) => prev + 1)

      // Handle specific error types with user-friendly messages
      let errorMessage = "Something went wrong. Please try again."

      if (err.message) {
        const message = err.message.toLowerCase()

        if (message.includes("user not found") || message.includes("invalid license")) {
          errorMessage = "This license doesn't exist. Please check your license and try again."
        } else if (
          message.includes("invalid password") ||
          message.includes("wrong password") ||
          message.includes("incorrect password")
        ) {
          errorMessage = "Login failed. The password you entered is incorrect."
        } else if (message.includes("account locked") || message.includes("too many attempts")) {
          errorMessage =
            "Your account has been temporarily locked due to too many failed attempts. Please try again later."
        } else if (message.includes("network") || message.includes("connection")) {
          errorMessage = "Unable to connect. Please check your internet connection and try again."
        } else {
          errorMessage = "Unable to sign in. Please check your credentials and try again."
        }
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Show a more helpful message after multiple failed attempts
  const getErrorMessage = () => {
    if (loginAttempts >= 3) {
      return (
        <>
          {error}
          <div className="mt-2 text-sm">
            <p>Having trouble signing in? Try these steps:</p>
            <ul className="pl-5 mt-1 list-disc">
              <li>Double-check your license and password</li>
              <li>Make sure caps lock is off</li>
              <li>Try clearing your browser cache</li>
              <li>Contact support if the issue continues</li>
            </ul>
          </div>
        </>
      )
    }
    return error
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-zinc-900">
      <div className="w-full max-w-md p-4">
        <Card className="border shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <img src="/novares-logo.webp" alt="Novares" className="h-12" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              Enter your license and password to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{getErrorMessage()}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="license">License</Label>
                <Input
                  id="license"
                  type="text"
                  placeholder="Enter your license"
                  value={license}
                  onChange={(e) => setLicense(e.target.value)}
                  required
                  disabled={isLoading}
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="focus:ring-2 focus:ring-blue-500"
                />
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-center text-gray-500">
              Don't have an account?{" "}
              <Link to="/register" className="font-medium text-blue-600 hover:underline">
                Create one here
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default Login