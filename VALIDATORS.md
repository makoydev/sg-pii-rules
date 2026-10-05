# Validators

Each validator named in `detectors.json` is specified here. Every implementation must produce the same result for the same input, and the fixtures check this. Sources are marked **primary** (a Singapore government publication), **secondary** (anything else), or **unverified**.

## sg_nric_fin_checksum

Accepts a Singapore NRIC or FIN whose check letter is correct. Case-insensitive.

**Format.** One prefix letter, seven digits, one check letter: `^[STFGM]\d{7}[A-Z]$`.

| Prefix | Issued to                                            | Since          |
| ------ | ---------------------------------------------------- | -------------- |
| S      | Citizens and permanent residents, born before 2000   |                |
| T      | Citizens and permanent residents, born 2000 or later |                |
| F      | Foreigners (FIN), issued before 2000                 |                |
| G      | Foreigners (FIN), issued 2000 to 2021                |                |
| M      | Foreigners (FIN)                                     | 1 January 2022 |

**Algorithm.**

```
weights = [2, 7, 6, 5, 4, 3, 2]
sum     = offset + Σ weights[i] × digit[i]      offset: S=0, T=4, F=0, G=4, M=3
r       = sum mod 11
letter  = table[r]
          S, T: "JZIHGFEDCBA"
          F, G: "XWUTRQPNMLK"
          M:    "XWUTRQPNJLK"
```

The M table differs from the F/G table only at `r = 8` (J instead of M). Some implementations write the M rule as `"KLJNPQRTUWX"[10 − r]`, which gives the same letters; a unit test checks the two forms agree.

Worked example (synthetic): `S1234567`: 2×1 + 7×2 + 6×3 + 5×4 + 4×5 + 3×6 + 2×7 = 106; 106 mod 11 = 7; table[7] = D, so `S1234567D` is valid.

**Status of the algorithm: community-derived, not officially published.**

- ICA announced the M series and its format, but not the check-letter algorithm [1].
- A 2004 government page offered the algorithm for sale only to Singapore-based organisations with a legitimate need, which suggests it was treated as restricted [3]. We found no current government statement either way.
- The S/T/F/G algorithm was reverse-engineered and published in 2003 [6]. The M-series rule above is implemented identically by three independent open-source projects, including GovTech's FormSG [7–9]. Our implementation was written from the description above, not copied from any of them, and it reproduces their results.

**Limits a consumer must know about.**

- A correct check letter does not mean the number was ever issued. ICA points out that a valid number is not a valid identity card [2].
- Fixtures use randomly generated digits. A generated number with a correct check letter may coincide with an issued one by chance. None is taken from any person.
- Published illustrative examples fail this check: ICA's `M1234567B` [1] and PDPC's `S1234567A` [4]. They are hard negatives in the fixtures.
- A partial NRIC such as `567D` is not a full NRIC under PDPC's guidelines (§5.2), though it is still personal data (§5.3) [4]. This validator does not match partial numbers.

## sg_nric_fin_checksum_invalid

Accepts a string with the NRIC/FIN shape (`^[STFGM]\d{7}[A-Z]$`, case-insensitive) whose check letter is **wrong** under `sg_nric_fin_checksum`. Used by the `NRIC_LIKE` detector to catch mistyped NRICs and NRIC-shaped look-alikes (ADR 0006). For any NRIC-shaped string, exactly one of the two validators returns true.

## payment_card_luhn_iin

Accepts a payment card number. Spaces and hyphens are removed first; what remains must be 13 to 19 digits that pass the **Luhn check** and start with a **card network prefix** at a length that network issues (ADR 0009).

**Luhn check.** Starting from the rightmost digit (the check digit) and moving left, double every second digit; if doubling gives more than 9, subtract 9. The number passes if the sum of all digits is a multiple of 10. Worked example (the textbook one): `79927398713` sums to 70, so it passes.

**Network prefixes and lengths.** A prefix range compares the number's leading digits with the range's ends, digit for digit.

| Network                   | Prefix (IIN) ranges              | Lengths    |
| ------------------------- | -------------------------------- | ---------- |
| Visa                      | 4                                | 13, 16, 19 |
| Mastercard                | 51–55, 2221–2720                 | 16         |
| American Express          | 34, 37                           | 15         |
| Discover                  | 6011, 644–649, 65, 622126–622925 | 16–19      |
| JCB                       | 3528–3589                        | 16–19      |
| UnionPay                  | 62                               | 16–19      |
| Diners Club International | 30, 36, 38–39                    | 14–19      |

Ranges may overlap (622126–622925 is both Discover and UnionPay); a number passes if any row accepts it.

**Limits a consumer must know about.**

- A number that passes is shaped like a card; that doesn't mean it was ever issued. Fixtures use random digits completed with a Luhn digit, so one may coincide with an issued card by chance. None is taken from any person or account.
- Networks not in the table, such as domestic debit schemes, are not detected.

**Sources.**

10. Primary. Mastercard, "Mastercard 2-Series BIN Impact Checklist (Merchants)", August 2016: the 222100–272099 range, processed like 510000–559999. <https://www.mastercard.us/content/dam/mccom/en-us/documents/merchant-2-series-BIN-impact-checklist-aug-2016.pdf>
11. Secondary. Wikipedia, "Payment card number", IIN table (checked 5 October 2026). The other networks' ranges and lengths; the card networks' own rule books are not public. <https://en.wikipedia.org/wiki/Payment_card_number>

## sg_postal_sector

Accepts a Singapore postal code: exactly six digits whose first two, the **postal sector**, are 01 to 82, except 74. The detector only offers digits that follow an address clue, so this check removes clued numbers that cannot be postal codes, such as `Singapore 990000` (ADR 0011).

**Format.** Postal codes have had six digits since 1995: the first two are the sector, the other four the delivery point [12]. The 81 sectors group into the 28 postal districts still used for property; property guides list sectors 01 to 73 and 75 to 82, and none lists 74 [13].

**Status of the sector list: secondary.** URA's district table, the usual primary reference, returned "not found" when checked on 5 October 2026. The two sources below agree with each other and with several property guides. A sector added later would be missed until this list changes.

**Sources.**

12. Secondary. Wikipedia, "Postal codes in Singapore" (checked 5 October 2026). <https://en.wikipedia.org/wiki/Postal_codes_in_Singapore>
13. Secondary. 99.co, "Understanding Singapore postal codes: history, evolution, and breakdown by district" (checked 5 October 2026). <https://www.99.co/singapore/insider/singapore-postal-codes/>

## calendar_date

Accepts a date that exists in the calendar, in one of these forms: `12/03/1988`, `12-03-1988` or `12.03.1988` (read day-first **or** month-first: it passes if either reading is a real date), `1988-03-12`, `12 Mar 1988` or `12 March 1988` (optional full stop after the month and comma before the year), and `March 12, 1988`. Month names are matched on their first three letters, in any case. The year is four digits; the detector limits it to 1900–2099.

A real date means: month 1 to 12, day from 1 to the month's length, with 29 February only in leap years (divisible by 4, except centuries not divisible by 400).

**It does not compare with today's date**, so a future date after a birth clue passes. Results never depend on when the code runs (ADR 0012).

## Sources for the NRIC/FIN validators

1. Primary. ICA media release, "New M FIN series to be introduced from 1 January 2022", 12 July 2021. <https://www.ica.gov.sg/news-and-publications/newsroom/media-release/new-m-fin-series-to-be-introduced-from-1-january-2022>
2. Primary. ICA media release, 29 July 2008. <https://www.ica.gov.sg/news-and-publications/newsroom/media-release/645>
3. Primary (archived). Ministry of Home Affairs page on the UIN/FIN algorithm, captured 1 September 2004. <https://web.archive.org/web/20040901073340/http://web1.internet.gov.sg/mha/sir/nrd/uin2.htm>
4. Primary. PDPC, Advisory Guidelines on the PDPA for NRIC and other National Identification Numbers, issued 31 August 2018, applied from 1 September 2019. <https://www.pdpc.gov.sg/organisations/regulations-decisions/regulatory-guidance/advisory-guidelines-on-the-personal-data-protection-act-for-nric-and-other-national-identification-numbers>
5. Primary. PDPC guidelines PDF. <https://www.pdpc.gov.sg/-/media/files/pdpc/pdf-files/advisory-guidelines/advisory-guidelines-for-nric-numbers---310818.pdf>
6. Secondary. Ngiam, "Fun with numbers", 2003. <https://www.ngiam.net/NRIC/outlinee.htm>
7. Secondary. GovTech FormSG, `packages/shared/utils/nric-validation.ts` (checked 28 September 2026 at commit `6aa8c46`). <https://github.com/opengovsg/FormSG>
8. Secondary. samliew/singapore-nric. <https://github.com/samliew/singapore-nric>
9. Secondary. ionbazan/go-nric. <https://github.com/ionbazan/go-nric>
