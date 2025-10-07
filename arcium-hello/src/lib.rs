use anchor_lang::prelude::*;

declare_id!("ArciUM1111111111111111111111111111111111111");

#[program]
pub mod arcium_hello {
    use super::*;
    pub fn greet(_ctx: Context<Greet>) -> Result<()> {
        msg!("hello, arcium 👋");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Greet {}
