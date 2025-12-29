"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { PageHeader } from "@/components/shared/breadcrumbs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthService } from "@/lib/services/auth.service"
import { toast } from "@/hooks/use-toast"
import { Lock } from "lucide-react"

const passwordSchema = z.object({
  old_password: z.string().min(1, "Current password is required"),
  new_password: z.string().min(8, "Password must be at least 8 characters"),
  new_password_confirmation: z.string().min(1, "Password confirmation is required"),
}).refine((data) => data.new_password === data.new_password_confirmation, {
  message: "Passwords do not match",
  path: ["new_password_confirmation"],
})

type PasswordFormData = z.infer<typeof passwordSchema>

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  
  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      old_password: "",
      new_password: "",
      new_password_confirmation: "",
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form

  const onSubmit = async (data: PasswordFormData) => {
    try {
      setLoading(true)
      await AuthService.changePassword({
        old_password: data.old_password,
        new_password: data.new_password,
        new_password_confirmation: data.new_password_confirmation,
      })
      
      toast({
        title: "Success",
        description: "Password updated successfully",
      })
      
      reset()
    } catch (error: any) {
      console.error("Failed to update password:", error)
      toast({
        title: "Error",
        description: error?.status?.message || "Failed to update password",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Settings" },
        ]}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            <CardTitle>Change Password</CardTitle>
          </div>
          <CardDescription>
            Update your account password. Make sure to use a strong password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="old_password">Current Password</Label>
              <Input
                id="old_password"
                type="password"
                {...register("old_password")}
                placeholder="Enter your current password"
                disabled={loading}
              />
              {errors.old_password && (
                <p className="text-sm text-destructive">
                  {errors.old_password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_password">New Password</Label>
              <Input
                id="new_password"
                type="password"
                {...register("new_password")}
                placeholder="Enter your new password"
                disabled={loading}
              />
              {errors.new_password && (
                <p className="text-sm text-destructive">
                  {errors.new_password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_password_confirmation">Confirm New Password</Label>
              <Input
                id="new_password_confirmation"
                type="password"
                {...register("new_password_confirmation")}
                placeholder="Confirm your new password"
                disabled={loading}
              />
              {errors.new_password_confirmation && (
                <p className="text-sm text-destructive">
                  {errors.new_password_confirmation.message}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

