WITH transferTB AS (
  SELECT
    date_trunc('day', evt_block_time) AS day,
    CASE
      WHEN "to" = 0x0000000000000000000000000000000000000000 THEN -CAST(value as INT256)
      ELSE CAST(value as INT256)
    END AS value
  FROM
    erc20_ethereum.evt_Transfer
  WHERE
    contract_address = 0x6d4CA1177087924edfE0908ef655169EA766FDc3
    AND ("to" = 0x0000000000000000000000000000000000000000 OR "from" = 0x0000000000000000000000000000000000000000)
),
dayTB AS (
  SELECT
    day,
    SUM(value) / 1e18 AS value
  FROM
      transferTB
  GROUP BY
      day
  ORDER BY
      day
)
SELECT
  day,
  value,
  SUM(value) OVER (ORDER BY day) AS totalSupply
FROM
  dayTB
ORDER BY
  day