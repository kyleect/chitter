use crate::{cardv2::CharacterCardV2, error::CharCardError};
use base64::engine::general_purpose::STANDARD;
use base64::{Engine as _, engine::general_purpose};
use flate2::{Compression, read::ZlibDecoder, write::ZlibEncoder};
use png::{Decoder, Encoder};
use serde_json::from_slice;
use std::fs::File;
use std::io::{BufReader, BufWriter, Cursor, Read, Write};
use std::path::Path;

const CHUNK_KEY: &str = "chara";

/// Decode zTXt compressed text
fn decode_ztxt(data: &[u8]) -> Result<String, CharCardError> {
    let mut decoder = ZlibDecoder::new(data);
    let mut s = String::new();
    decoder.read_to_string(&mut s)?;
    Ok(s)
}

/// Encode zTXt compressed text
fn encode_ztxt(text: &str) -> Result<Vec<u8>, CharCardError> {
    let mut encoder = ZlibEncoder::new(vec![], Compression::default());
    encoder.write_all(text.as_bytes())?;
    Ok(encoder.finish()?)
}

/// Read a V2 character card from PNG (supports tEXt + zTXt)
pub fn read_card_from_png<P: AsRef<Path>>(path: P) -> Result<CharacterCardV2, CharCardError> {
    let file = File::open(path)?;
    let decoder = Decoder::new(BufReader::new(file));
    let reader = decoder.read_info()?;

    let info = reader.info();

    // --- tEXt ---
    for chunk in &info.uncompressed_latin1_text {
        if chunk.keyword == CHUNK_KEY {
            let decoded = general_purpose::STANDARD.decode(&chunk.text)?;
            let card: CharacterCardV2 = from_slice(&decoded)?;
            return Ok(card);
        }
    }

    // --- zTXt ---
    for chunk in &info.compressed_latin1_text {
        if chunk.keyword == CHUNK_KEY {
            let decompressed = decode_ztxt(&chunk.get_text().unwrap().as_bytes())?;
            let decoded = general_purpose::STANDARD.decode(decompressed)?;
            let card: CharacterCardV2 = from_slice(&decoded)?;
            return Ok(card);
        }
    }

    Err(CharCardError::MissingCard)
}

pub fn read_card_from_bytes(bytes: &[u8]) -> Result<CharacterCardV2, CharCardError> {
    let decoder = Decoder::new(Cursor::new(bytes));
    let reader = decoder.read_info()?;

    let info = reader.info();

    // --- tEXt ---
    for chunk in &info.uncompressed_latin1_text {
        if chunk.keyword == CHUNK_KEY {
            let decoded = STANDARD.decode(&chunk.text)?;
            let card = from_slice(&decoded)?;
            return Ok(card);
        }
    }

    // --- zTXt ---
    for chunk in &info.compressed_latin1_text {
        if chunk.keyword == CHUNK_KEY {
            let decompressed = decode_ztxt(&chunk.get_text().unwrap().as_bytes())?;
            let decoded = STANDARD.decode(decompressed)?;
            let card = from_slice(&decoded)?;
            return Ok(card);
        }
    }

    Err(CharCardError::MissingCard)
}

/// Write card with optional compression
pub fn write_card_to_png<P: AsRef<Path>>(
    input_png: P,
    output_png: P,
    card: &CharacterCardV2,
    compress: bool,
) -> Result<(), CharCardError> {
    let input = File::open(input_png)?;
    let decoder = Decoder::new(BufReader::new(input));
    let mut reader = decoder.read_info()?;

    let mut buf = vec![0; reader.output_buffer_size().unwrap()];
    let frame = reader.next_frame(&mut buf)?;

    let info = reader.info();

    let output = File::create(output_png)?;
    let writer = BufWriter::new(output);

    let mut encoder = Encoder::new(writer, frame.width, frame.height);
    encoder.set_color(info.color_type);
    encoder.set_depth(info.bit_depth);

    // Copy existing tEXt (excluding chara)
    for chunk in &info.uncompressed_latin1_text {
        if chunk.keyword != CHUNK_KEY {
            encoder.add_text_chunk(chunk.keyword.clone(), chunk.text.clone())?;
        }
    }

    // Copy existing zTXt (excluding chara)
    for chunk in &info.compressed_latin1_text {
        if chunk.keyword != CHUNK_KEY {
            encoder.add_ztxt_chunk(chunk.keyword.clone(), chunk.get_text().unwrap())?;
        }
    }

    // Serialize card
    let json = serde_json::to_vec(card)?;
    let base64 = general_purpose::STANDARD.encode(json);

    if compress {
        let compressed = encode_ztxt(&base64)?;
        encoder.add_ztxt_chunk(
            CHUNK_KEY.to_string(),
            str::from_utf8(&compressed).unwrap().to_string(),
        )?;
    } else {
        encoder.add_text_chunk(CHUNK_KEY.to_string(), base64)?;
    }

    let mut writer = encoder.write_header()?;
    writer.write_image_data(&buf[..frame.buffer_size()])?;

    Ok(())
}
