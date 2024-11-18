"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps as NextThemeProviderProps } from "next-themes"

export const ThemeProvider = ({ 
  children, 
  ...props 
}: NextThemeProviderProps) => {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}