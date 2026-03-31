terraform {
  required_version = ">= 1.6.0"

  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 2.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

provider "vercel" {
  api_token = var.vercel_api_token
  team      = var.vercel_team_id
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# Platform — atlas-homevault.com
module "platform" {
  source             = "./modules/mosaic-app"
  app_name           = "platform"
  subdomain          = "@"
  root_domain        = var.root_domain
  cloudflare_zone_id = var.cloudflare_zone_id
  github_repo        = var.github_repo
}

# Budget — budget.atlas-homevault.com
module "budget" {
  source             = "./modules/mosaic-app"
  app_name           = "budget"
  subdomain          = "budget"
  root_domain        = var.root_domain
  cloudflare_zone_id = var.cloudflare_zone_id
  github_repo        = var.github_repo
}

# Calendar — calendar.atlas-homevault.com
module "calendar" {
  source             = "./modules/mosaic-app"
  app_name           = "calendar"
  subdomain          = "calendar"
  root_domain        = var.root_domain
  cloudflare_zone_id = var.cloudflare_zone_id
  github_repo        = var.github_repo
}

# Baby Tracker — baby.atlas-homevault.com
module "baby_tracker" {
  source             = "./modules/mosaic-app"
  app_name           = "baby-tracker"
  subdomain          = "baby"
  root_domain        = var.root_domain
  cloudflare_zone_id = var.cloudflare_zone_id
  github_repo        = var.github_repo
}

# Home Assistant — home.atlas-homevault.com
module "home" {
  source             = "./modules/mosaic-app"
  app_name           = "home"
  subdomain          = "home"
  root_domain        = var.root_domain
  cloudflare_zone_id = var.cloudflare_zone_id
  github_repo        = var.github_repo
}
