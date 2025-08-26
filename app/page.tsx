"use client"

import { useState, useTransition, useOptimistic, useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Users, UserPlus, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Participant {
  id: string
  name: string
  email: string
  registeredAt: Date
}

interface FormState {
  success: boolean
  message: string
  participant?: Participant
}

// Simulate server action for form submission
async function submitRegistration(prevState: FormState, formData: FormData): Promise<FormState> {
  const name = formData.get("name") as string
  const email = formData.get("email") as string

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Basic validation
  if (!name || name.trim().length < 2) {
    return {
      success: false,
      message: "Nama harus diisi minimal 2 karakter",
    }
  }

  if (!email || !email.includes("@")) {
    return {
      success: false,
      message: "Email tidak valid",
    }
  }

  // Simulate successful registration
  const participant: Participant = {
    id: Date.now().toString(),
    name: name.trim(),
    email: email.trim(),
    registeredAt: new Date(),
  }

  return {
    success: true,
    message: "Pendaftaran berhasil!",
    participant,
  }
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Memproses...
        </>
      ) : (
        <>
          <UserPlus className="mr-2 h-4 w-4" />
          Daftar Sekarang
        </>
      )}
    </Button>
  )
}

export default function RegistrationApp() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [optimisticParticipants, addOptimisticParticipant] = useOptimistic(
    participants,
    (state, newParticipant: Participant) => [...state, newParticipant],
  )
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const [formState, formAction] = useActionState(submitRegistration, {
    success: false,
    message: "",
  })

  // Handle form submission with optimistic updates
  const handleSubmit = async (formData: FormData) => {
    const name = formData.get("name") as string
    const email = formData.get("email") as string

    if (!name || !email) return

    // Optimistic update
    const optimisticParticipant: Participant = {
      id: `temp-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      registeredAt: new Date(),
    }

    startTransition(() => {
      addOptimisticParticipant(optimisticParticipant)
    })

    // Submit form
    const result = await submitRegistration(formState, formData)

    if (result.success && result.participant) {
      setParticipants((prev) => [...prev, result.participant!])
      toast({
        title: "Berhasil!",
        description: result.message,
      })

      // Reset form
      const form = document.getElementById("registration-form") as HTMLFormElement
      form?.reset()
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Formulir Pendaftaran Online</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Daftarkan diri Anda dengan mudah menggunakan formulir modern yang dilengkapi dengan teknologi React 18/19
            hooks terbaru
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Registration Form */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-accent" />
                Pendaftaran Peserta
              </CardTitle>
              <CardDescription>Isi formulir di bawah ini untuk mendaftar sebagai peserta</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                id="registration-form"
                action={async (formData) => {
                  await handleSubmit(formData)
                }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Masukkan nama lengkap Anda"
                    required
                    className="transition-all duration-200 focus:ring-2 focus:ring-accent/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="contoh@email.com"
                    required
                    className="transition-all duration-200 focus:ring-2 focus:ring-accent/20"
                  />
                </div>

                {formState.message && (
                  <div
                    className={`p-3 rounded-md text-sm ${
                      formState.success
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {formState.success && <CheckCircle className="h-4 w-4" />}
                      {formState.message}
                    </div>
                  </div>
                )}

                <SubmitButton />
              </form>
            </CardContent>
          </Card>

          {/* Participants List */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                Daftar Peserta
                <Badge variant="secondary" className="ml-auto">
                  {optimisticParticipants.length} peserta
                </Badge>
              </CardTitle>
              <CardDescription>Peserta yang telah terdaftar dalam sistem</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {optimisticParticipants.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Belum ada peserta yang terdaftar</p>
                  </div>
                ) : (
                  optimisticParticipants.map((participant, index) => (
                    <div
                      key={participant.id}
                      className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                        participant.id.startsWith("temp-")
                          ? "bg-muted/50 border-dashed opacity-70"
                          : "bg-card border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-card-foreground">{participant.name}</h3>
                          <p className="text-sm text-muted-foreground">{participant.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Terdaftar: {participant.registeredAt.toLocaleString("id-ID")}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Info */}
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-4 gap-4 text-center">
              <div className="space-y-2">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto">
                  <Loader2 className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold">useTransition</h3>
                <p className="text-sm text-muted-foreground">Loading state saat submit</p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto">
                  <CheckCircle className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold">useActionState</h3>
                <p className="text-sm text-muted-foreground">Validasi form otomatis</p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto">
                  <UserPlus className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold">useFormStatus</h3>
                <p className="text-sm text-muted-foreground">Status submit real-time</p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold">useOptimistic</h3>
                <p className="text-sm text-muted-foreground">Update UI optimistik</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
