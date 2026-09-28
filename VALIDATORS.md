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

**Sources.**

1. Primary. ICA media release, "New M FIN series to be introduced from 1 January 2022", 12 July 2021. <https://www.ica.gov.sg/news-and-publications/newsroom/media-release/new-m-fin-series-to-be-introduced-from-1-january-2022>
2. Primary. ICA media release, 29 July 2008. <https://www.ica.gov.sg/news-and-publications/newsroom/media-release/645>
3. Primary (archived). Ministry of Home Affairs page on the UIN/FIN algorithm, captured 1 September 2004. <https://web.archive.org/web/20040901073340/http://web1.internet.gov.sg/mha/sir/nrd/uin2.htm>
4. Primary. PDPC, Advisory Guidelines on the PDPA for NRIC and other National Identification Numbers, issued 31 August 2018, applied from 1 September 2019. <https://www.pdpc.gov.sg/organisations/regulations-decisions/regulatory-guidance/advisory-guidelines-on-the-personal-data-protection-act-for-nric-and-other-national-identification-numbers>
5. Primary. PDPC guidelines PDF. <https://www.pdpc.gov.sg/-/media/files/pdpc/pdf-files/advisory-guidelines/advisory-guidelines-for-nric-numbers---310818.pdf>
6. Secondary. Ngiam, "Fun with numbers", 2003. <https://www.ngiam.net/NRIC/outlinee.htm>
7. Secondary. GovTech FormSG, `packages/shared/utils/nric-validation.ts` (checked 28 September 2026 at commit `6aa8c46`). <https://github.com/opengovsg/FormSG>
8. Secondary. samliew/singapore-nric. <https://github.com/samliew/singapore-nric>
9. Secondary. ionbazan/go-nric. <https://github.com/ionbazan/go-nric>
