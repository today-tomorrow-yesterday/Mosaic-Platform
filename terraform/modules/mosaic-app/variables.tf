variable "app_name" {
  description = "Name of the app (matches apps/* folder name)"
  type        = string
}

variable "subdomain" {
  description = "Subdomain prefix. Use '@' for root domain."
  type        = string
}

variable "root_domain" {
  description = "Root domain (atlas-homevault.com)"
  type        = string
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID"
  type        = string
}

variable "github_repo" {
  description = "GitHub repo in owner/name format"
  type        = string
}

variable "environment_variables" {
  description = "Environment variables to set on the Vercel project"
  type = list(object({
    key    = string
    value  = string
    target = list(string)
  }))
  default = []
}
