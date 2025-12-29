"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import type { ChurchMember, ChurchMemberFormData } from "@/lib/types/member"
import { cn } from "@/lib/utils"

const memberSchema = z.object({
  membership_number: z.string().min(1, "Membership number is required"),
  name: z.string().min(1, "Name is required"),
  father_husband_name: z.string().optional(),
  occupation: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  marital_status: z.enum(["single", "married", "widowed", "divorced"]).optional(),
  address_line_1: z.string().optional(),
  address_line_2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  country: z.string().optional(),
  current_residence_same_as_address: z.boolean().default(true),
  mobile_number: z.string().optional(),
  date_of_birth: z.string().optional(),
  marriage_date: z.string().optional(),
  member_since_year: z.coerce.number().optional(),
  baptized_year: z.coerce.number().optional(),
  spiritual_status: z.string().optional(),
})

interface MemberFormProps {
  member?: ChurchMember
  onSubmit: (data: ChurchMemberFormData) => Promise<void>
  loading?: boolean
}

export function MemberForm({ member, onSubmit, loading }: MemberFormProps) {
  const form = useForm<ChurchMemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      membership_number: member?.membership_number || "",
      name: member?.name || "",
      father_husband_name: member?.father_husband_name || "",
      occupation: member?.occupation || "",
      gender: member?.gender || undefined,
      marital_status: member?.marital_status || undefined,
      address_line_1: member?.address_line_1 || "",
      address_line_2: member?.address_line_2 || "",
      city: member?.city || "",
      state: member?.state || "",
      pincode: member?.pincode || "",
      country: member?.country || "India",
      current_residence_same_as_address: member?.current_residence_same_as_address ?? true,
      mobile_number: member?.mobile_number || "",
      date_of_birth: member?.date_of_birth || "",
      marriage_date: member?.marriage_date || "",
      member_since_year: member?.member_since_year,
      baptized_year: member?.baptized_year,
      spiritual_status: member?.spiritual_status || "",
    },
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form

  const name = watch("name")
  const initials = name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?"

  const currentResidenceSame = watch("current_residence_same_as_address")

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Avatar & Basic Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarFallback className="text-2xl bg-primary/10">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm text-muted-foreground mb-6">
                Member photo will be auto-generated from initials
              </p>
              
              <Separator className="mb-6" />
              
              <div className="w-full space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Same address as residence</Label>
                    <p className="text-xs text-muted-foreground">
                      Current residence is same as address
                    </p>
                  </div>
                  <Switch
                    checked={currentResidenceSame}
                    onCheckedChange={(checked) =>
                      setValue("current_residence_same_as_address", checked)
                    }
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Main Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Member Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Details */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="membership_number">
                  Membership Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="membership_number"
                  {...register("membership_number")}
                  placeholder="e.g., MEM001"
                />
                {errors.membership_number && (
                  <p className="text-xs text-destructive">
                    {errors.membership_number.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Enter full name"
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="father_husband_name">Father/Husband Name</Label>
                <Input
                  id="father_husband_name"
                  {...register("father_husband_name")}
                  placeholder="Enter name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile_number">Mobile Number</Label>
                <Input
                  id="mobile_number"
                  {...register("mobile_number")}
                  placeholder="+91 9876543210"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={watch("gender")}
                  onValueChange={(value) => setValue("gender", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="marital_status">Marital Status</Label>
                <Select
                  value={watch("marital_status")}
                  onValueChange={(value) => setValue("marital_status", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  {...register("date_of_birth")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  {...register("occupation")}
                  placeholder="Enter occupation"
                />
              </div>
            </div>

            <Separator />

            {/* Address */}
            <div>
              <h4 className="text-sm font-medium mb-4">Address</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address_line_1">Address Line 1</Label>
                  <Input
                    id="address_line_1"
                    {...register("address_line_1")}
                    placeholder="Street address"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address_line_2">Address Line 2</Label>
                  <Input
                    id="address_line_2"
                    {...register("address_line_2")}
                    placeholder="Apartment, suite, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" {...register("city")} placeholder="City" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" {...register("state")} placeholder="State" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    {...register("pincode")}
                    placeholder="Pincode"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    {...register("country")}
                    placeholder="Country"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Church Details */}
            <div>
              <h4 className="text-sm font-medium mb-4">Church Membership</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="member_since_year">Member Since (Year)</Label>
                  <Input
                    id="member_since_year"
                    type="number"
                    {...register("member_since_year")}
                    placeholder="e.g., 2015"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="baptized_year">Baptized Year</Label>
                  <Input
                    id="baptized_year"
                    type="number"
                    {...register("baptized_year")}
                    placeholder="e.g., 2010"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marriage_date">Marriage Date</Label>
                  <Input
                    id="marriage_date"
                    type="date"
                    {...register("marriage_date")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="spiritual_status">Spiritual Status</Label>
                  <Input
                    id="spiritual_status"
                    {...register("spiritual_status")}
                    placeholder="e.g., Active, Elder"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && (
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          )}
          {member ? "Save Changes" : "Create Member"}
        </Button>
      </div>
    </form>
  )
}

