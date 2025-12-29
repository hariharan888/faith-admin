"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/shared/breadcrumbs"
import { MemberForm } from "@/components/forms/member-form"
import { MembersService } from "@/lib/services/members.service"
import type { ChurchMemberFormData } from "@/lib/types/member"
import { toast } from "@/hooks/use-toast"

export default function NewMemberPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: ChurchMemberFormData) => {
    try {
      setLoading(true)
      await MembersService.create(data)
      toast({
        title: "Success",
        description: "Member created successfully",
      })
      router.push("/members")
    } catch (error) {
      console.error("Failed to create member:", error)
      toast({
        title: "Error",
        description: "Failed to create member",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create New Member"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Members", href: "/members" },
          { label: "Create" },
        ]}
      />
      <MemberForm onSubmit={handleSubmit} loading={loading} />
    </div>
  )
}

