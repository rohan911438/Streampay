use anchor_lang::prelude::*;

declare_id!("Subscr1pt1onMana9er1111111111111111111111111");

pub const BACKEND_AUTHORITY_BYTES: [u8; 32] = [42u8; 32];

#[program]
pub mod subscription_manager {
    use super::*;

    pub fn create_subscription_plan(
        ctx: Context<CreateSubscriptionPlan>,
        plan_id: u64,
        amount: u64,
        duration_seconds: i64,
    ) -> Result<()> {
        require!(amount > 0, SubscriptionError::InvalidAmount);
        require!(duration_seconds > 0, SubscriptionError::InvalidDuration);

        let plan = &mut ctx.accounts.subscription_plan;
        plan.merchant = ctx.accounts.merchant.key();
        plan.plan_id = plan_id;
        plan.amount = amount;
        plan.duration_seconds = duration_seconds;

        Ok(())
    }

    pub fn activate_subscription(
        ctx: Context<ActivateSubscription>,
        payment_record: Pubkey,
    ) -> Result<()> {
        let authority = ctx.accounts.authority.key();
        let plan = &ctx.accounts.subscription_plan;
        let payment = &ctx.accounts.payment_record;

        require!(
            authority == payment.user
                || authority == payment.merchant
                || authority.to_bytes() == BACKEND_AUTHORITY_BYTES,
            SubscriptionError::Unauthorized
        );
        require!(payment.merchant == plan.merchant, SubscriptionError::InvalidMerchant);
        require!(payment.amount >= plan.amount, SubscriptionError::InvalidAmount);
        require!(payment.is_confirmed, SubscriptionError::PaymentNotConfirmed);
        require!(payment.plan_id == plan.plan_id, SubscriptionError::InvalidPlan);

        let now = Clock::get()?.unix_timestamp;
        let subscription = &mut ctx.accounts.subscription;
        subscription.user = payment.user;
        subscription.merchant = plan.merchant;
        subscription.plan_id = plan.plan_id;
        subscription.amount = plan.amount;
        subscription.payment_record = payment_record;
        subscription.start_timestamp = now;
        subscription.end_timestamp = now
            .checked_add(plan.duration_seconds)
            .ok_or(SubscriptionError::TimestampOverflow)?;
        subscription.status = SubscriptionStatus::Active;

        Ok(())
    }

    pub fn renew_subscription(
        ctx: Context<RenewSubscription>,
        payment_record: Pubkey,
    ) -> Result<()> {
        let authority = ctx.accounts.authority.key();
        let plan = &ctx.accounts.subscription_plan;
        let payment = &ctx.accounts.payment_record;
        let subscription = &mut ctx.accounts.subscription;

        require!(
            authority == subscription.user
                || authority == subscription.merchant
                || authority.to_bytes() == BACKEND_AUTHORITY_BYTES,
            SubscriptionError::Unauthorized
        );
        require!(payment.is_confirmed, SubscriptionError::PaymentNotConfirmed);
        require!(payment.user == subscription.user, SubscriptionError::InvalidPaymentUser);
        require!(payment.merchant == subscription.merchant, SubscriptionError::InvalidMerchant);
        require!(payment.plan_id == subscription.plan_id, SubscriptionError::InvalidPlan);
        require!(payment.amount >= plan.amount, SubscriptionError::InvalidAmount);
        require!(plan.plan_id == subscription.plan_id, SubscriptionError::InvalidPlan);

        subscription.payment_record = payment_record;

        let now = Clock::get()?.unix_timestamp;
        if subscription.status == SubscriptionStatus::Expired || subscription.end_timestamp < now {
            subscription.start_timestamp = now;
            subscription.end_timestamp = now
                .checked_add(plan.duration_seconds)
                .ok_or(SubscriptionError::TimestampOverflow)?;
        } else {
            subscription.end_timestamp = subscription
                .end_timestamp
                .checked_add(plan.duration_seconds)
                .ok_or(SubscriptionError::TimestampOverflow)?;
        }

        subscription.amount = plan.amount;
        subscription.status = SubscriptionStatus::Active;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateSubscriptionPlan<'info> {
    #[account(mut)]
    pub merchant: Signer<'info>,
    #[account(init, payer = merchant, space = SubscriptionPlan::SPACE)]
    pub subscription_plan: Account<'info, SubscriptionPlan>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ActivateSubscription<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(init, payer = authority, space = Subscription::SPACE)]
    pub subscription: Account<'info, Subscription>,
    pub subscription_plan: Account<'info, SubscriptionPlan>,
    pub payment_record: Account<'info, PaymentRecord>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RenewSubscription<'info> {
    pub authority: Signer<'info>,
    #[account(mut)]
    pub subscription: Account<'info, Subscription>,
    pub subscription_plan: Account<'info, SubscriptionPlan>,
    pub payment_record: Account<'info, PaymentRecord>,
}

#[account]
pub struct SubscriptionPlan {
    pub merchant: Pubkey,
    pub plan_id: u64,
    pub amount: u64,
    pub duration_seconds: i64,
}

impl SubscriptionPlan {
    pub const SPACE: usize = 8 + 32 + 8 + 8 + 8;
}

#[account]
pub struct Subscription {
    pub user: Pubkey,
    pub merchant: Pubkey,
    pub plan_id: u64,
    pub amount: u64,
    pub payment_record: Pubkey,
    pub start_timestamp: i64,
    pub end_timestamp: i64,
    pub status: SubscriptionStatus,
}

impl Subscription {
    pub const SPACE: usize = 8 + 32 + 32 + 8 + 8 + 32 + 8 + 8 + 1;
}

#[account]
pub struct PaymentRecord {
    pub user: Pubkey,
    pub merchant: Pubkey,
    pub plan_id: u64,
    pub amount: u64,
    pub is_confirmed: bool,
}

impl PaymentRecord {
    pub const SPACE: usize = 8 + 32 + 32 + 8 + 8 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum SubscriptionStatus {
    Active,
    Expired,
}

#[error_code]
pub enum SubscriptionError {
    #[msg("Amount must be greater than zero.")]
    InvalidAmount,
    #[msg("Subscription duration must be greater than zero.")]
    InvalidDuration,
    #[msg("Merchant address is invalid.")]
    InvalidMerchant,
    #[msg("The payment record user does not match the subscription user.")]
    InvalidPaymentUser,
    #[msg("The subscription plan does not match the payment record.")]
    InvalidPlan,
    #[msg("The payment has not been confirmed yet.")]
    PaymentNotConfirmed,
    #[msg("Timestamp overflow while computing subscription dates.")]
    TimestampOverflow,
    #[msg("Caller is not authorized to perform this action.")]
    Unauthorized,
}