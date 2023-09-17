WITH
  ethPrice as (
    SELECT day1, eth_daily
    FROM (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY day1 ORDER BY day1 DESC) as row_num
      FROM (
        SELECT
          DATE_TRUNC('day', minute) as day1,
          price AS eth_daily
        FROM prices.usd
        WHERE
          (blockchain = 'ethereum' AND symbol = 'WETH')
          AND (DATE_TRUNC('day', minute) >= CAST('2022-10-02' AS TIMESTAMP))
      )
    ) t
    WHERE row_num = 1
  ),
  osqthPrice as (
    SELECT day2, osqth_daily
    FROM (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY day2 ORDER BY day2 DESC) as row_num
      FROM (
        SELECT
          DATE_TRUNC('day', minute) as day2,
          price AS osqth_daily
        FROM prices.usd
        WHERE (blockchain = 'ethereum' AND symbol = 'oSQTH')
          AND (DATE_TRUNC('day', minute) >= CAST('2022-10-02' AS TIMESTAMP))
      )
    ) t
    WHERE row_num = 1
  ),
  transferTB AS (
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
  maxTotalSupply AS (
    SELECT
      day as day3,
      SUM(value) OVER (ORDER BY day) AS totalSupply
    FROM
      (
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
    ORDER BY
      day
  ),
  allEventsWETH AS (
    SELECT
      date_trunc('day', evt_block_time) AS day,
      evt_block_number as block_number,
      -CAST(value as INT256) as value
    FROM
      erc20_ethereum.evt_Transfer
    WHERE
      contract_address = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
      AND "from" = 0x12804580C15F4050dda61D44AFC94623198848bC
    UNION ALL
    SELECT
      date_trunc('day', evt_block_time) AS day,
      evt_block_number as block_number,
      CAST(value as INT256) as value
    FROM
      erc20_ethereum.evt_Transfer
    WHERE
      contract_address = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
      AND "to" = 0x12804580C15F4050dda61D44AFC94623198848bC
  ),
  treasuryBalanceWETH AS (
    SELECT
      day as day4,
      SUM(value) OVER (ORDER BY day) AS treasuryBalanceWETH
    FROM (
      SELECT
        day,
        SUM(value) as value
      from allEventsWETH
      GROUP BY day
    )
  ),
  allEventsUSDC AS (
    SELECT
      date_trunc('day', evt_block_time) AS day,
      evt_block_number as block_number,
      -CAST(value as INT256) as value
    FROM
      erc20_ethereum.evt_Transfer
    WHERE
      contract_address = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
      AND "from" = 0x12804580C15F4050dda61D44AFC94623198848bC
    UNION ALL
    SELECT
      date_trunc('day', evt_block_time) AS day,
      evt_block_number as block_number,
      CAST(value as INT256) as value
    FROM
      erc20_ethereum.evt_Transfer
    WHERE
      contract_address = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
      AND "to" = 0x12804580C15F4050dda61D44AFC94623198848bC
  ),
  treasuryBalanceUSDC AS (
    SELECT
      day as day5,
      SUM(value) OVER (ORDER BY day) AS treasuryBalanceUSDC
    FROM (
      SELECT
        day,
        SUM(value) as value
      from allEventsUSDC
      GROUP BY day
    )
  ),
  allEventsOSQTH AS (
    SELECT
      date_trunc('day', evt_block_time) AS day,
      evt_block_number as block_number,
      -CAST(value as INT256) as value
    FROM
      erc20_ethereum.evt_Transfer
    WHERE
      contract_address = 0xf1B99e3E573A1a9C5E6B2Ce818b617F0E664E86B
      AND "from" = 0x12804580C15F4050dda61D44AFC94623198848bC
    UNION ALL
    SELECT
      date_trunc('day', evt_block_time) AS day,
      evt_block_number as block_number,
      CAST(value as INT256) as value
    FROM
      erc20_ethereum.evt_Transfer
    WHERE
      contract_address = 0xf1B99e3E573A1a9C5E6B2Ce818b617F0E664E86B
      AND "to" = 0x12804580C15F4050dda61D44AFC94623198848bC
  ),
  treasuryBalanceOSQTH AS (
    SELECT
      day as day6,
      SUM(value) OVER (ORDER BY day) AS treasuryBalanceOSQTH
    FROM (
      SELECT
        day,
        SUM(value) as value
      from allEventsOSQTH
      GROUP BY day
    )
  ),
  poolEthUsdcMints as (
    SELECT
      date_trunc('day', evt_block_time) as day,
      evt_block_number as block_number,
      amount1 as amountWeth0,
      amount0 as amountUSDC
    FROM
      uniswap_v3_ethereum.Pair_evt_Mint
    WHERE owner = 0x12804580C15F4050dda61D44AFC94623198848bC AND contract_address = 0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8
  ),
  poolEthUsdcDaily as (
    SELECT day as day7, amountWeth0, amountUSDC
    FROM (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY day ORDER BY block_number DESC) as row_num
      FROM poolEthUsdcMints
    ) t
    WHERE row_num = 1
  ),
  poolEthOsqthMints as (
    SELECT
      date_trunc('day', evt_block_time) as day,
      evt_block_number as block_number,
      amount0 as amountWeth1,
      amount1 as amountOSQTH
    FROM
      uniswap_v3_ethereum.Pair_evt_Mint
    WHERE owner = 0x12804580C15F4050dda61D44AFC94623198848bC AND contract_address = 0x82c427AdFDf2d245Ec51D8046b41c4ee87F0d29C
  ),
  poolEthOsqthDaily as (
    SELECT day as day8, amountWeth1, amountOSQTH
    FROM (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY day ORDER BY block_number DESC) as row_num
      FROM poolEthOsqthMints
    ) t
    WHERE row_num = 1
  ),
  combined AS (
    select * from ethPrice tb1
    left join osqthPrice tb2 on tb1.day1 = tb2.day2
    left join maxTotalSupply tb3 on tb1.day1 = tb3.day3
    left join treasuryBalanceWETH tb4 on tb1.day1 = tb4.day4
    left join treasuryBalanceUSDC tb5 on tb1.day1 = tb5.day5
    left join treasuryBalanceOSQTH tb6 on tb1.day1 = tb6.day6
    left join poolEthUsdcDaily tb7 on tb1.day1 = tb7.day7
    left join poolEthOsqthDaily tb8 on tb1.day1 = tb8.day8
  ),
  prettified AS (
    select 
      day1 as day,
      eth_daily,
      osqth_daily,
      totalSupply,
      treasuryBalanceWETH,
      treasuryBalanceUSDC,
      treasuryBalanceOSQTH,
      CAST(amountWeth0 AS INT256) as amountWeth0,
      CAST(amountWeth1 AS INT256) as amountWeth1,
      CAST(amountUSDC AS INT256) as amountUSDC,
      CAST(amountOSQTH AS INT256) as amountOSQTH
     FROM combined ORDER BY day ASC
  ),
  filled AS (
    SELECT
        day,
        eth_daily,
        osqth_daily,
        MAX(totalSupply) OVER (PARTITION BY grouper1) AS totalSupply,
        MAX(treasuryBalanceWETH) OVER (PARTITION BY grouper2) AS treasuryBalanceWETH,
        MAX(treasuryBalanceUSDC) OVER (PARTITION BY grouper3) AS treasuryBalanceUSDC,
        MAX(treasuryBalanceOSQTH) OVER (PARTITION BY grouper4) AS treasuryBalanceOSQTH,
        MAX(amountWeth0) OVER (PARTITION BY grouper5) AS amountWeth0,
        MAX(amountWeth1) OVER (PARTITION BY grouper6) AS amountWeth1,
        MAX(amountUSDC) OVER (PARTITION BY grouper7) AS amountUSDC,
        MAX(amountOSQTH) OVER (PARTITION BY grouper8) AS amountOSQTH
    FROM
        (
            SELECT
                day,
                eth_daily,
                osqth_daily,
                totalSupply,
                treasuryBalanceWETH,
                treasuryBalanceUSDC,
                treasuryBalanceOSQTH,
                amountWeth0,
                amountWeth1,
                amountUSDC,
                amountOSQTH,
                COUNT(totalSupply) OVER (ORDER BY day) AS grouper1,
                COUNT(treasuryBalanceWETH) OVER (ORDER BY day) AS grouper2,
                COUNT(treasuryBalanceUSDC) OVER (ORDER BY day) AS grouper3,
                COUNT(treasuryBalanceOSQTH) OVER (ORDER BY day) AS grouper4,
                COUNT(amountWeth0) OVER (ORDER BY day) AS grouper5,
                COUNT(amountWeth1) OVER (ORDER BY day) AS grouper6,
                COUNT(amountUSDC) OVER (ORDER BY day) AS grouper7,
                COUNT(amountOSQTH) OVER (ORDER BY day) AS grouper8
            FROM
                prettified
        ) AS grouped
    ORDER BY
        day
  ),
  cleared as (
    SELECT
      day,
      eth_daily,
      osqth_daily,
      COALESCE(totalSupply, 0) AS tS,
      COALESCE(treasuryBalanceWETH, CAST(0 AS INT256)) AS tbW,
      COALESCE(treasuryBalanceUSDC, CAST(0 AS INT256)) AS tBU,
      COALESCE(treasuryBalanceOSQTH, CAST(0 AS INT256)) AS tbO,
      COALESCE(amountWeth0, CAST(0 AS INT256)) AS aW0,
      COALESCE(amountWeth1, CAST(0 AS INT256)) AS aW1,
      COALESCE(amountUSDC, CAST(0 AS INT256)) AS aU,
      COALESCE(amountOSQTH, CAST(0 AS INT256)) AS aO
    FROM filled
  ),
  calculated as (
    SELECT
      *,
      (100*(((tbW+aW0+aW1)/1e18 + ((tBU+aU)/eth_daily)/1e6 + (osqth_daily*(tbO+aO)/eth_daily)/1e18)/tS-1)) AS performance
    FROM cleared
  )
  SELECT * from calculated
