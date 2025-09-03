import RoleProtectedRoute from "@/components/RoleProtectedRoute";
import { Slot } from "expo-router";
import React from "react";

export default function NGOLayout() {
  return (
    <RoleProtectedRoute allowedRoles={["ngo"]}>
      <Slot />
    </RoleProtectedRoute>
  );
}
