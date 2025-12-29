"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Check, X, Heart, User, MapPin, Briefcase, GraduationCap } from "lucide-react"
import { format, differenceInYears } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/breadcrumbs"
import { StatusLabel } from "@/components/shared/status-label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MatrimonyService } from "@/lib/services/matrimony.service"
import type { MatrimonyProfile } from "@/lib/types/matrimony"
import { toast } from "@/hooks/use-toast"

export default function MatrimonyDetailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const profileId = Number(searchParams.get("id"))
  
  const [profile, setProfile] = useState<MatrimonyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectDialog, setRejectDialog] = useState({
    open: false,
    reason: "",
  })

  useEffect(() => {
    if (profileId) {
      fetchProfile()
    } else {
      router.push("/matrimony")
    }
  }, [profileId])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const data = await MatrimonyService.getById(profileId)
      setProfile(data)
    } catch (error) {
      console.error("Failed to fetch profile:", error)
      toast({
        title: "Error",
        description: "Failed to load profile details",
        variant: "destructive",
      })
      router.push("/matrimony")
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    try {
      setActionLoading(true)
      await MatrimonyService.approve(profileId)
      setProfile(prev => prev ? { ...prev, profile_status: "approved" } : null)
      toast({
        title: "Success",
        description: "Profile approved successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve profile",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectDialog.reason.trim()) return

    try {
      setActionLoading(true)
      await MatrimonyService.reject(profileId, rejectDialog.reason)
      setProfile(prev => prev ? { 
        ...prev, 
        profile_status: "rejected", 
        rejection_reason: rejectDialog.reason 
      } : null)
      toast({
        title: "Success",
        description: "Profile rejected",
      })
      setRejectDialog({ open: false, reason: "" })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject profile",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!profile) {
    return null
  }

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const age = profile.date_of_birth
    ? differenceInYears(new Date(), new Date(profile.date_of_birth))
    : null

  const isPending = profile.profile_status === "pending_approval"

  return (
    <div className="space-y-6">
      <PageHeader
        title={profile.name}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Matrimony", href: "/matrimony" },
          { label: profile.name },
        ]}
        actions={
          isPending && (
            <>
              <Button 
                variant="outline" 
                className="border-red-500 text-red-500 hover:bg-red-500/10"
                onClick={() => setRejectDialog({ open: true, reason: "" })}
                disabled={actionLoading}
              >
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button 
                className="bg-green-500 hover:bg-green-600"
                onClick={handleApprove}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Approve
              </Button>
            </>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                {profile.profile_photo_url ? (
                  <AvatarImage src={profile.profile_photo_url} alt={profile.name} />
                ) : null}
                <AvatarFallback className="text-2xl bg-primary/10">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-semibold text-lg">{profile.name}</h3>
              {age && (
                <p className="text-sm text-muted-foreground">{age} years old</p>
              )}
              
              <div className="mt-3">
                <StatusLabel status={profile.profile_status.replace("_", " ")} />
              </div>
              
              <Separator className="my-6" />
              
              <div className="w-full space-y-3 text-left">
                <InfoRow icon={<User className="h-4 w-4" />} label="Gender" value={profile.gender} />
                <InfoRow icon={<Heart className="h-4 w-4" />} label="Marital Status" value={profile.marital_status} />
                <InfoRow icon={<Briefcase className="h-4 w-4" />} label="Occupation" value={profile.occupation} />
                <InfoRow icon={<GraduationCap className="h-4 w-4" />} label="Education" value={profile.education} />
                <InfoRow icon={<MapPin className="h-4 w-4" />} label="Location" value={[profile.city, profile.state].filter(Boolean).join(", ")} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Profile Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Personal Info */}
            <div>
              <h4 className="text-sm font-medium mb-4">Personal Information</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailRow label="Date of Birth" value={profile.date_of_birth ? format(new Date(profile.date_of_birth), "PPP") : undefined} />
                <DetailRow label="Height" value={profile.height} />
                <DetailRow label="Weight" value={profile.weight} />
                <DetailRow label="Blood Group" value={profile.blood_group} />
                <DetailRow label="Complexion" value={profile.complexion} />
                <DetailRow label="Physical Status" value={profile.physical_status} />
              </div>
            </div>

            <Separator />

            {/* Family Info */}
            <div>
              <h4 className="text-sm font-medium mb-4">Family Information</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailRow label="Father's Name" value={profile.father_name} />
                <DetailRow label="Father's Occupation" value={profile.father_occupation} />
                <DetailRow label="Mother's Name" value={profile.mother_name} />
                <DetailRow label="Mother's Occupation" value={profile.mother_occupation} />
                <DetailRow label="Siblings" value={profile.siblings_count?.toString()} />
              </div>
            </div>

            <Separator />

            {/* Religious Info */}
            <div>
              <h4 className="text-sm font-medium mb-4">Religious Information</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailRow label="Religion" value={profile.religion} />
                <DetailRow label="Caste" value={profile.caste} />
                <DetailRow label="Sub-Caste" value={profile.sub_caste} />
                <DetailRow label="Mother Tongue" value={profile.mother_tongue} />
              </div>
            </div>

            {profile.about_me && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2">About</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {profile.about_me}
                  </p>
                </div>
              </>
            )}

            {profile.partner_expectations && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2">Partner Expectations</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {profile.partner_expectations}
                  </p>
                </div>
              </>
            )}

            {profile.rejection_reason && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2 text-destructive">Rejection Reason</h4>
                  <p className="text-sm text-muted-foreground">
                    {profile.rejection_reason}
                  </p>
                </div>
              </>
            )}

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-4">Record Info</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailRow label="Submitted At" value={new Date(profile.created_at).toLocaleString()} />
                <DetailRow label="Last Updated" value={new Date(profile.updated_at).toLocaleString()} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) => !open && setRejectDialog({ open: false, reason: "" })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Profile</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this profile. The user will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="Enter the reason for rejection..."
                value={rejectDialog.reason}
                onChange={(e) => setRejectDialog(prev => ({ ...prev, reason: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialog({ open: false, reason: "" })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectDialog.reason.trim() || actionLoading}
            >
              {actionLoading && (
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              Reject Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm capitalize">{value || "—"}</p>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm capitalize">{value || "—"}</p>
    </div>
  )
}

