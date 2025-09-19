# Deposits Solution - Logical Data Model

## Overview
This document describes the logical data model for the Deposits Solution, derived from analyzing the vocabulary file. The model represents the core entities, their attributes, and relationships that support deposit account management operations.

## Core Entities

### 1. Customer
**Primary Key:** `partyId`

**Description:** Represents bank customers who can own deposit accounts.

**Key Attributes:**
- `partyId` (String) - Unique customer identifier
- `partyRole` (String) - Role in account relationship (OWNER, JOINT.OWNER, etc.)
- `channel` (String) - Origination channel (BRANCH, ONLINE)
- `dormancyStatus` (String) - Account dormancy classification
- `dormancyStatusDate` (String) - Date dormancy status was set
- `contractDate` (String) - Original contract signing date
- `lineOfBusiness` (String) - Business segment (RETAIL, CORPORATE)
- `companyCode` (String) - Entity responsible for account
- `branch` (String) - Branch identifier

**Business Rules:**
- Customers can own multiple accounts
- Supports joint ownership scenarios
- Role-based access control
- Dormancy status tracking for compliance

### 2. Account
**Primary Key:** `accountId`

**Description:** Core banking account entity supporting various account types.

**Key Attributes:**
- `accountId` (String) - Unique account identifier
- `accountName` (String) - Customer-friendly account nickname
- `accountReference` (String) - Alternate identifier (IBAN, legacy)
- `accountBalance` (Number) - Real-time available balance
- `ledgerBalance` (Number) - Actual balance including uncleared
- `availableBalance` (Number) - Usable balance after restrictions
- `currency` (String) - ISO 3-digit currency code
- `accountStatus` (String) - Account condition status
- `status` (String) - Operational status (ACTIVE, CLOSED, BLOCKED)
- `openingDate` (String) - Account creation date
- `maturityDate` (String) - Account maturity date
- `branchCode` (String) - Opening branch
- `companyCode` (String) - Owning entity
- `referenceType` (String) - Type of alternate reference (IBAN, LEGACY)

**Business Rules:**
- Multi-currency support with sub-accounts
- Status lifecycle management
- Balance calculations with restrictions
- Reference type validation

### 3. Deposit
**Primary Key:** `accountId` (inherits from Account)

**Description:** Specialized account type for term deposits with interest calculations.

**Key Attributes:**
- `accountId` (String) - Links to parent Account
- `depositAmount` (String) - Principal deposit amount
- `depositBalance` (String) - Current deposit balance
- `accruedInterest` (String) - Interest earned to date
- `depositTerm` (String) - Duration (D/W/M/Y format)
- `interestPayoutFrequency` (String) - Payment frequency
- `interestPayoutOption` (String) - Payment method
- `fundingAccount` (String) - Source account for deposit
- `payoutAccount` (String) - Destination for proceeds
- `withdrawalType` (String) - Early withdrawal type
- `withdrawalAmount` (String) - Partial withdrawal amount

**Business Rules:**
- Inherits all Account properties and behaviors
- Interest calculation and payout management
- Early withdrawal penalties
- Maturity processing

### 4. Product
**Primary Key:** `productId`

**Description:** Product catalog defining account/deposit offerings and configurations.

**Key Attributes:**
- `productId` (String) - Unique product identifier
- `productCode` (String) - Product classification code
- `productType` (String) - Product category
- `product` (String) - Product name
- `property` (String) - Product configuration property

**Business Rules:**
- Defines account behavior and features
- Configuration-driven product rules
- Pricing and benefit structures

### 5. Transaction
**Primary Key:** `transactionReference`

**Description:** Records all financial transactions and activities on accounts.

**Key Attributes:**
- `transactionReference` (String) - Unique transaction ID
- `accountId` (String) - Associated account
- `transactionCode` (String) - Transaction type classifier
- `transactionAmount` (String) - Transaction value
- `transactionDescription` (String) - Transaction description
- `paymentAmount` (Number) - Payment amount
- `paymentValueDate` (String) - Value date
- `paymentDescription` (String) - Payment description
- `activityAmount` (Number) - Activity monetary value
- `activityDate` (String) - Activity booking date
- `bookingDate` (String) - Official booking date
- `valueDate` (String) - Value date for interest
- `reversalIndicator` (String) - Reversal flag
- `merchant` (String) - Merchant code
- `merchantCategoryCode` (String) - MCC classification
- `acquirer` (String) - Acquiring institution

**Business Rules:**
- Debit/Credit transaction processing
- Value date processing for interest
- Transaction reversal capability
- Multi-party transaction validation
- Audit trail requirements

## Supporting Entities

### 6. SettlementInstruction
**Primary Key:** `accountId`

**Description:** Defines payment routing and settlement configurations for accounts.

**Key Attributes:**
- `accountId` (String) - Associated account
- `defaultSettlementAccountId` (String) - Default settlement account
- `payoutAccountId` (String) - Payout destination account
- `payInAccountId` (String) - Payin source account
- `defaultBeneficiaryId` (String) - Default beneficiary
- `payoutBeneficiaryId` (String) - Payout beneficiary
- `payInBeneficiaryId` (String) - Payin beneficiary
- `enablePayInSettlement` (Boolean) - Auto payin settlement
- `enablePayoutSettlement` (Boolean) - Auto payout settlement

**Business Rules:**
- Mutual exclusivity between account and beneficiary
- Automated settlement processing
- Payment routing logic

### 7. BlockedFunds
**Primary Key:** `blockedReference`

**Description:** Manages fund blocking and reservation functionality.

**Key Attributes:**
- `blockedReference` (String) - Unique block identifier
- `accountId` (String) - Account with blocked funds
- `blockedAmount` (Number) - Amount blocked
- `blockRemarks` (String) - Reason for blocking
- `blockingReference` (String) - External reference
- `startDate` (String) - Block effective date
- `endDate` (String) - Auto-release date
- `blockFundsKey` (String) - System-generated key

**Business Rules:**
- Temporary fund blocking capability
- Automatic release on end date
- Manual override capability
- Complete audit trail

### 8. PostingRestriction
**Primary Key:** `accountId`

**Description:** Controls debit/credit posting permissions on accounts.

**Key Attributes:**
- `accountId` (String) - Restricted account
- `restrictionCode` (String) - Restriction type (DR_BLOCK, CR_BLOCK, ALL_BLOCK)
- `blockingCode` (String) - Code to apply restriction
- `unblockingCode` (String) - Code to remove restriction
- `blockingReason` (String) - Reason for restriction
- `unblockingReason` (String) - Reason for removal
- `startDate` (String) - Restriction start date
- `endDate` (String) - Restriction end date

**Business Rules:**
- Granular posting control (debit/credit/both)
- Temporary or permanent restrictions
- Audit trail for compliance

### 9. OverdraftLimit
**Primary Key:** `accountId`

**Description:** Manages overdraft facilities and limits for accounts.

**Key Attributes:**
- `accountId` (String) - Account with overdraft
- `overdraftLimit` (String) - Maximum approved limit
- `overdraftLimitAmount` (Number) - Limit amount
- `overdraftAvailable` (Boolean) - Limit availability flag
- `effectiveDate` (String) - Limit effective date
- `narrative` (String) - Limit change description

**Business Rules:**
- Credit facility management
- Limit availability control
- Change audit trail

### 10. PaymentSchedule
**Primary Key:** `accountId`

**Description:** Manages scheduled payments and frequencies for accounts.

**Key Attributes:**
- `accountId` (String) - Associated account
- `paymentType` (String) - Type of payment (interest, principal)
- `paymentFrequency` (String) - Payment recurrence
- `newFrequency` (String) - Updated frequency
- `effectiveDate` (String) - Schedule effective date
- `property` (String) - Schedule property

**Business Rules:**
- Automated payment scheduling
- Frequency change management
- Interest and principal payments

### 11. Statement
**Primary Key:** `accountId`

**Description:** Account statement generation and configuration.

**Key Attributes:**
- `accountId` (String) - Statement account
- `newFrequency` (String) - Statement frequency
- `openingBalance` (String) - Period opening balance
- `closingBalance` (String) - Period closing balance
- `bookingDate` (String) - Statement booking date
- `valueDate` (String) - Statement value date

**Business Rules:**
- Configurable statement frequencies
- Period balance calculations
- Statement delivery management

## Entity Relationships

### Primary Relationships
1. **Customer → Account** (1:Many)
   - Customers can own multiple accounts
   - Supports joint ownership scenarios

2. **Account → Deposit** (1:1 specialization)
   - Deposit inherits all Account properties
   - Adds deposit-specific attributes and behaviors

3. **Account → Product** (Many:1)
   - Accounts are created under specific products
   - Product defines account behavior and features

### Supporting Relationships
4. **Account → Transaction** (1:Many)
   - Accounts have multiple transactions over time
   - Complete transaction history maintained

5. **Account → SettlementInstruction** (1:1)
   - Optional settlement configuration per account
   - Defines payment routing rules

6. **Account → BlockedFunds** (1:Many)
   - Multiple fund blocks can exist per account
   - Temporary or permanent blocking

7. **Account → PostingRestriction** (1:1)
   - Optional posting restrictions per account
   - Controls debit/credit permissions

8. **Account → OverdraftLimit** (1:1)
   - Optional overdraft facility per account
   - Credit limit management

9. **Account → PaymentSchedule** (1:1)
   - Optional payment scheduling per account
   - Automated payment processing

10. **Account → Statement** (1:Many)
    - Multiple statements generated over time
    - Configurable frequency and format

## Key Business Rules Summary

### Data Integrity
- Primary and foreign key constraints enforced
- Referential integrity between related entities
- Data type and format validations

### Business Logic
- Mutual exclusivity rules (settlement account vs beneficiary)
- Balance calculations considering blocks and restrictions
- Interest calculation and payout processing
- Automated workflow processing (maturity, dormancy)

### Compliance & Audit
- Complete audit trail for all changes
- Dormancy status tracking and reporting
- Regulatory compliance controls
- Transaction monitoring and reporting

### Multi-tenancy & Scaling
- Company code segregation
- Branch-level processing
- Multi-currency support
- Sub-account hierarchies

This logical data model provides a comprehensive foundation for the deposits solution, ensuring data consistency, business rule enforcement, and regulatory compliance while supporting scalable operations across multiple channels and business lines.
