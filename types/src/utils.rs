use chrono::{Local, TimeZone};

pub fn local_datetime_parse_from_str(date: &str, fmt: &str) -> chrono::DateTime<Local> {
    let naive_date = chrono::NaiveDate::parse_from_str(date, fmt).unwrap();
    let naive_datetime = naive_date.and_hms_opt(0, 0, 0).unwrap();
    Local.from_local_datetime(&naive_datetime).unwrap()
}
