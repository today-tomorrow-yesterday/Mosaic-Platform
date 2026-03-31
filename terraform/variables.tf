variable "root_domain" {
  description = "Root domain managed in Cloudflare"
  type        = string
  default     = "atlas-homevault.com"
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID for atlas-homevault.com"
  type        = string
  sensitive   = true
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token with DNS edit permissions"
  type        = string
  sensitive   = true
}

variable "vercel_api_token" {
  description = "Vercel API token"
  type        = string
  sensitive   = true
}

variable "vercel_team_id" {
  description = "Vercel team ID (leave empty for personal accounts)"
  type        = string
  default     = ""
}

variable "github_repo" {
  description = "GitHub repo in owner/name format"
  type        = string
  default     = "today-tomorrow-yesterday/Mosaic-Platform"
}
