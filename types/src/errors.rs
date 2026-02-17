use thiserror::Error;

#[derive(Error, Debug, PartialEq)]
pub enum Error {
    #[error("Invalid date for transaction")]
    InvalidTransactionDate,
    #[error("Invalid bill id '{0}' passed when creating new transaction")]
    InvalidBillIdOnNewTransaction(u64),
}
