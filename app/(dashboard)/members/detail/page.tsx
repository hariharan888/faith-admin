"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/breadcrumbs"
import { MemberForm } from "@/components/forms/member-form"
import { StatusLabel } from "@/components/shared/status-label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { MembersService } from "@/lib/services/members.service"
import type { ChurchMember, ChurchMemberFormData } from "@/lib/types/member"
import { toast } from "@/hooks/use-toast"

export default function MemberDetailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const memberId = Number(searchParams.get("id"))
  const isEditing = searchParams.get("edit") === "true"
  
  const [member, setMember] = useState<ChurchMember | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (memberId) {
      fetchMember()
    } else {
      router.push("/members")
    }
  }, [memberId])

  const fetchMember = async () => {
    try {
      setLoading(true)
      const data = await MembersService.getById(memberId)
      setMember(data)
    } catch (error) {
      console.error("Failed to fetch member:", error)
      toast({
        title: "Error",
        description: "Failed to load member details",
        variant: "destructive",
      })
      router.push("/members")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (data: ChurchMemberFormData) => {
    try {
      setSaving(true)
      await MembersService.update(memberId, data)
      toast({
        title: "Success",
        description: "Member updated successfully",
      })
      router.push(`/members/detail?id=${memberId}`)
    } catch (error) {
      console.error("Failed to update member:", error)
      toast({
        title: "Error",
        description: "Failed to update member",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!member) {
    return null
  }

  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  if (isEditing) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Edit Member"
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Members", href: "/members" },
            { label: member.name, href: `/members/detail?id=${member.id}` },
            { label: "Edit" },
          ]}
        />
        <MemberForm member={member} onSubmit={handleUpdate} loading={saving} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={member.name}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Members", href: "/members" },
          { label: member.name },
        ]}
        actions={
          <Button onClick={() => router.push(`/members/detail?id=${member.id}&edit=true`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Member
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarFallback className="text-2xl bg-primary/10">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-semibold text-lg">{member.name}</h3>
              <p className="text-sm text-muted-foreground">{member.membership_number}</p>
              
              {member.marital_status && (
                <div className="mt-3">
                  <StatusLabel status={member.marital_status} />
                </div>
              )}
              
              <Separator className="my-6" />
              
              <div className="w-full space-y-3 text-left">
                <InfoRow label="Gender" value={member.gender} />
                <InfoRow label="Occupation" value={member.occupation} />
                <InfoRow label="Mobile" value={member.mobile_number} />
                <InfoRow 
                  label="Date of Birth" 
                  value={member.date_of_birth ? new Date(member.date_of_birth).toLocaleDateString() : undefined} 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Member Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Address Section */}
            <div>
              <h4 className="text-sm font-medium mb-4">Address</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoRow label="Address Line 1" value={member.address_line_1} />
                <InfoRow label="Address Line 2" value={member.address_line_2} />
                <InfoRow label="City" value={member.city} />
                <InfoRow label="State" value={member.state} />
                <InfoRow label="Pincode" value={member.pincode} />
                <InfoRow label="Country" value={member.country} />
              </div>
            </div>

            <Separator />

            {/* Church Membership Section */}
            <div>
              <h4 className="text-sm font-medium mb-4">Church Membership</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoRow label="Member Since" value={member.member_since_year?.toString()} />
                <InfoRow label="Baptized Year" value={member.baptized_year?.toString()} />
                <InfoRow 
                  label="Marriage Date" 
                  value={member.marriage_date ? new Date(member.marriage_date).toLocaleDateString() : undefined} 
                />
                <InfoRow label="Spiritual Status" value={member.spiritual_status} />
                <InfoRow label="Father/Husband Name" value={member.father_husband_name} />
              </div>
            </div>

            <Separator />

            {/* Timestamps */}
            <div>
              <h4 className="text-sm font-medium mb-4">Record Info</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoRow 
                  label="Created At" 
                  value={new Date(member.created_at).toLocaleString()} 
                />
                <InfoRow 
                  label="Last Updated" 
                  value={new Date(member.updated_at).toLocaleString()} 
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm capitalize">{value || "—"}</p>
    </div>
  )
}

