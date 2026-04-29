use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxTWqk7Y8M6w7x5Z3YqJ5hP5hZ");

pub const MAX_EXECUTION_REFERENCE_LENGTH: usize = 128;
pub const BACKEND_AUTHORITY_BYTES: [u8; 32] = [42u8; 32];

#[program]
pub mod payment_router {
    use super::*;

    pub fn create_payment(
        ctx: Context<CreatePayment>,
        merchant: Pubkey,
        amount: u64,
        payment_type: PaymentType,
    ) -> Result<()> {
        require!(amount > 0, PaymentRouterError::InvalidAmount);
        require!(merchant != Pubkey::default(), PaymentRouterError::InvalidMerchant);

        let payment_record = &mut ctx.accounts.payment_record;
        payment_record.user = ctx.accounts.user.key();
        payment_record.merchant = merchant;
        payment_record.amount = amount;
        payment_record.payment_type = payment_type;
        payment_record.execution_reference = String::new();
        payment_record.timestamp = Clock::get()?.unix_timestamp;
        payment_record.status = PaymentStatus::Pending;

        Ok(())
    }

    pub fn confirm_payment(
        ctx: Context<ConfirmPayment>,
        execution_reference: String,
    ) -> Result<()> {
        require!(
            execution_reference.len() <= MAX_EXECUTION_REFERENCE_LENGTH,
            PaymentRouterError::ExecutionReferenceTooLong
        );

        let payment_record = &mut ctx.accounts.payment_record;
        require!(
            payment_record.status == PaymentStatus::Pending,
            PaymentRouterError::PaymentAlreadyCompleted
        );

        let authority = ctx.accounts.authority.key();
        require!(
            authority == payment_record.user
                || authority == payment_record.merchant
                || authority.to_bytes() == BACKEND_AUTHORITY_BYTES,
            PaymentRouterError::Unauthorized
        );

        payment_record.execution_reference = execution_reference;
        payment_record.status = PaymentStatus::Completed;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreatePayment<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(init, payer = user, space = PaymentRecord::SPACE)]
    pub payment_record: Account<'info, PaymentRecord>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ConfirmPayment<'info> {
    pub authority: Signer<'info>,
    #[account(mut)]
    pub payment_record: Account<'info, PaymentRecord>,
}

#[account]
pub struct PaymentRecord {
    pub user: Pubkey,
    pub merchant: Pubkey,
    pub amount: u64,
    pub payment_type: PaymentType,
    pub execution_reference: String,
    pub timestamp: i64,
    pub status: PaymentStatus,
}

impl PaymentRecord {
    pub const SPACE: usize = 8
        + 32
        + 32
        + 8
        + 1
        + 4
        + MAX_EXECUTION_REFERENCE_LENGTH
        + 8
        + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum PaymentType {
    Private,
    Public,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum PaymentStatus {
    Pending,
    Completed,
}

#[error_code]
pub enum PaymentRouterError {
    #[msg("Amount must be greater than zero.")]
    InvalidAmount,
    #[msg("Merchant address cannot be the default public key.")]
    InvalidMerchant,
    #[msg("Execution reference is too long.")]
    ExecutionReferenceTooLong,
    #[msg("Payment has already been completed.")]
    PaymentAlreadyCompleted,
    #[msg("Caller is not authorized to confirm this payment.")]
    Unauthorized,
}