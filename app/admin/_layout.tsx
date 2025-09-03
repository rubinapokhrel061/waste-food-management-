import RoleProtectedRoute from "@/components/RoleProtectedRoute";
import { Slot } from "expo-router";
import React from "react";

export default function AdminLayout() {
  return (
    <RoleProtectedRoute allowedRoles={["admin"]}>
      <Slot />
    </RoleProtectedRoute>
  );
}
