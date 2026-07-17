> ---
> ## ⚠️ DOCUMENT STATUS: SUPERSEDED — HISTORICAL REFERENCE ONLY
>
> **Marked during Phase 1 documentation consolidation, 16 July 2026 (audit findings DOC-P0-001, DOC-P0-003).**
>
> This document is an earlier-generation product overview. It is retained for historical context only and is **not** part of the authoritative Version 1.0 documentation suite.
>
> Where this document conflicts with later documents, it does **not** apply. In particular:
>
> - The statement "Owner transactions are automatically approved" is **incorrect** under the approved product model. Customer verification is mandatory for every Purchase Record regardless of recorder (owner, manager, staff, or integration) — see PRD0 §14, PRD1 AP-005/BR-009, PRD5 BR-058.
> - "Loyalty products" are now **Reward Programs** (PRD4 §3).
> - Subscription plan names and limits shown here are **not approved** (open decision — TRD23 OPD-001/OPD-002).
> - The reward mechanic is governed by PRD6 §4.4 (10 Verified Units, fixed in MVP) and the TRD.
>
> **Authoritative sources:** Platform Constitution, PRD0–PRD10, TRD Chapters 1–23, and `docs/00-governance/canonical-reference.md`.
> ---

# 11thONUS Product Definition

## Version 1.0

# Executive Summary

11thONUS is a cloud-based loyalty platform designed specifically for small and medium-sized businesses that want to reward repeat customers without investing in expensive Point-of-Sale (POS) systems or complex loyalty infrastructure.

At its core, the platform enables businesses to run a simple and familiar loyalty model:

**Buy 10. The 11th is On Us.**

Rather than focusing on discounts, coupons or points, 11thONUS helps businesses build stronger relationships with their customers by recognizing loyalty and encouraging repeat visits.

The platform serves as a shared loyalty ecosystem where customers register once and use a single loyalty identity across multiple participating businesses. Each business independently manages its own loyalty products, staff, customer interactions and reporting while operating under the 11thONUS platform.

The platform is intentionally designed for African markets where many businesses still operate without integrated POS systems and where mobile phones are the primary customer engagement channel.

# Vision

To become Africa's simplest and most trusted customer loyalty platform for everyday businesses.

# Mission

Help businesses retain customers through simple, transparent and meaningful loyalty programs while giving customers one digital loyalty identity they can use everywhere.

# Brand Promise

Every 11th.

On Us.

# Product Philosophy

11thONUS is not a discount platform.

It is a customer appreciation platform.

Businesses are not reducing prices.

They are simply saying:

"Thank you for choosing us again."

Instead of rewarding customers with points that are difficult to understand, 11thONUS creates a very clear journey.

Come back.

Keep choosing us.

When the time comes…

This one's on us.

# Target Markets

Initial Launch

• Burundi

Expansion

• Rwanda

• Uganda

• Kenya

Future

Pan-African expansion.

# Target Customers

## Primary Customers (Paying Customers)

Businesses operating recurring services or products.

Examples include:

• Hair salons

• Barber shops

• Restaurants

• Cafés

• Coffee shops

• Pizza outlets

• Burger restaurants

• Car washes

• Bakeries

• Juice bars

• Ice cream shops

• Pharmacies

• Dry cleaners

• Laundry services

• Fitness centres

• Beauty spas

• Massage clinics

• Vehicle service centres

• Mobile repair shops

• Pet grooming businesses

Any business where customers are expected to return repeatedly.

# Secondary Users

Consumers.

Consumers never pay subscription fees.

They simply register and participate in loyalty programs across participating businesses.

# Core Concept

Each participating business creates one or more loyalty products.

Example

Bella Salon

Premium Haircut

Buy 10

11th On Us

Standard Haircut

Buy 10

11th On Us

Joe's Coffee

Large Cappuccino

Buy 10

11th On Us

Latte

Buy 10

11th On Us

Customers accumulate qualifying purchases independently for each business and product.

Progress never mixes between businesses.

# Platform Users

## Customer

A registered consumer participating in loyalty programs.

Capabilities include:

• Register

• Login

• View loyalty dashboard

• View participating businesses

• View progress

• View transaction history

• Redeem rewards

• View pending approvals

• Update profile

## Business Owner

Owner of a subscribed business.

Responsible for:

• Business profile

• Subscription

• Staff

• Loyalty products

• Fraud settings

• Approvals

• Reports

• Customer engagement

## Business Manager

Optional role.

May manage:

• Staff

• Daily operations

• Transaction approvals

• Redemptions

• Reports

Permissions determined by owner.

## Staff Member

Registers qualifying purchases.

Can:

• Search customers

• Scan customer QR codes

• Record purchases

• Redeem rewards

Cannot:

• Configure business

• Delete records

• Change subscription

• Modify fraud rules

## Super Administrator

Platform operator.

Responsible for:

• Business onboarding

• Subscription management

• Platform reports

• Fraud monitoring

• Customer support

• Country management

• Currency management

• Feature configuration

# Business Registration

Each business creates:

Business Name

Business Category

Country

City

Physical Address

Contact Details

Business Logo

Business Owner

Subscription Plan

Business Status

# Branch Management

The MVP supports a single branch.

Architecture shall support future multi-branch expansion.

Each transaction records branch identity even if only one branch exists.

# Staff Management

Every staff member receives an individual account.

Shared accounts are prohibited.

Staff records include:

Name

Phone Number

Email (optional)

Role

Status

Date Created

Created By

Permissions

Every activity is traceable to the staff member.

# Loyalty Products

Businesses define the products eligible for loyalty.

Examples:

Premium Haircut

Regular Haircut

Medium Pizza

Family Pizza

Regular Coffee

SUV Car Wash

The platform does not prescribe product types.

Businesses decide what they wish to reward.

Each product includes:

Product Name

Category

Description

Normal Selling Price

Reward Rule

Reward Quantity

Reward Value

Status

Multiple Quantity Allowed

Friends Contribution Allowed

Approval Threshold

# Loyalty Engine

The first release uses:

Pay for 10

Receive the 11th

The engine shall be designed to support future expansion including:

Buy 5 Get 1

Buy 20 Get 1

Birthday Rewards

Campaign Rewards

Seasonal Rewards

Referral Rewards

Membership Rewards

without changing platform architecture.

# Customer Identity

Each customer receives:

Unique Customer Number

QR Code

Profile

Phone Number

The customer uses one identity across all participating businesses.

# Purchase Recording

Purchases may be recorded by:

Business Owner

Manager

Staff Member

Each purchase includes:

Customer

Business

Product

Quantity

Recorded By

Branch

Date

Time

Approval Status

Device Information

Notes

# Quantity Support

The system supports multiple qualifying units in one transaction.

Examples include:

Five Burgers

Three Haircuts

Eleven Coffees

Four Car Washes

One transaction may therefore contribute multiple qualifying purchases.

# Friends and Family

Businesses may choose whether loyalty accounts can accumulate purchases made by other people.

Example:

A customer sends family members to use their loyalty code.

The business decides whether these purchases count.

This setting is configurable per loyalty product.

# Progress Tracking

Customers can see:

Current Progress

Remaining Purchases

Pending Purchases

Approved Purchases

Reward Available

Reward History

Businesses can see:

Customers approaching redemption

Most active customers

Reward redemptions

Customer visit trends

# Reward Redemption

When qualifying purchases reach the configured threshold:

The reward becomes available.

Staff process redemption.

The redemption becomes part of the permanent audit history.

Progress resets for the next loyalty cycle.

# Fraud Prevention Philosophy

The platform assumes legitimate business activity while helping businesses identify unusual transactions.

The objective is not to block business.

The objective is to make suspicious activity visible.

# Fraud Controls

Every transaction records:

Who entered it

When

Where

For whom

For which product

Using which account

Businesses configure:

Approval thresholds

Maximum staff approval quantity

Multiple quantity rules

Customer confirmation requirements

Backdated transaction policy

Bulk transaction policy

Owner transactions are automatically approved.

Flagged staff transactions enter a review queue.

Nothing is permanently deleted.

Every correction becomes part of the audit trail.

# Audit Trail

Every system action is permanently recorded.

Examples:

Purchase Recorded

Purchase Approved

Purchase Rejected

Purchase Reversed

Reward Redeemed

Staff Added

Product Updated

Business Settings Changed

This creates complete accountability.

# Subscription Plans

Plans are determined primarily by the number of active loyalty products.

Example

Starter

Up to 10 products

Growth

Up to 20 products

Professional

Unlimited products

Higher plans unlock additional capabilities including:

More staff

Branches

Advanced reporting

Marketing tools

API access

# Business Dashboard

Businesses access:

Customer Analytics

Product Performance

Upcoming Rewards

Reward Redemptions

Staff Activity

Approval Queue

Fraud Alerts

Subscription Status

Reports

# Customer Dashboard

Customers access:

Digital Loyalty Card

QR Code

Businesses Joined

Progress

Upcoming Rewards

Reward History

Profile

Notifications

# Super Admin Portal

Platform administrators manage:

Businesses

Subscriptions

Countries

Currencies

Support Cases

Fraud Reports

Platform Statistics

Revenue

Platform Configuration

# Reporting

Business reports include:

Customer Growth

Repeat Visits

Products Performing Best

Rewards Issued

Rewards Redeemed

Staff Activity

Pending Approvals

Fraud Flags

Subscription Usage

Platform reports include:

Businesses Registered

Customers Registered

Transactions Processed

Rewards Issued

Country Distribution

Monthly Revenue

Active Businesses

Active Customers

# Technology Platform

Frontend

React

TypeScript

Tailwind CSS

Progressive Web Application (PWA)

Backend

Firebase Authentication

Cloud Firestore

Cloud Functions

Firebase Storage

Firebase Hosting

Firebase Analytics

Firebase Crashlytics

Firebase App Check

# Design Principles

The platform must always be:

Simple

Fast

Mobile-first

Trustworthy

Transparent

Easy to train

Easy to deploy

Easy to scale

# Future Roadmap

Following MVP launch, future releases may introduce:

Referral Rewards

Birthday Rewards

Gift Rewards

Marketing Campaigns

Push Notifications

WhatsApp Integration

POS Integration

Mobile Money Rewards

AI Fraud Detection

Business Marketplace

Customer Discovery

API Integrations

CRM Integration

Promotional Campaign Builder

Multi-Branch Management

Business Intelligence Dashboards

Cross-Business Promotions

# Product Success Definition

11thONUS succeeds when:

Businesses retain more customers.

Customers return more often.

Businesses clearly understand customer loyalty.

Reward redemption remains simple and trusted.

The platform becomes the default loyalty infrastructure for small businesses across Africa.

Ultimately, 11thONUS should become the platform that enables every small business to say, with confidence and consistency:

**"Thank you for coming back. This one's on us."**