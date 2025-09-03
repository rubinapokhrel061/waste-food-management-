import RoleProtectedRoute from "@/components/RoleProtectedRoute";
import { Slot } from "expo-router";
import React from "react";

export default function DonorLayout() {
  return (
    <RoleProtectedRoute allowedRoles={["donor"]}>
      <Slot />
    </RoleProtectedRoute>
  );
}
