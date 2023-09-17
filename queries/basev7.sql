with ethPriceClose as (
  SELECT
    DATE_TRUNC('day', minute) as day,
    price AS eth_close
  FROM
    prices.usd
  WHERE (blockchain = 'ethereum' AND symbol = 'WETH')
    AND (DATE_TRUNC('day', minute) >= CAST('2022-10-02' AS TIMESTAMP))
    AND (hour(minute) = 23 AND minute(minute) = 59)
),
osqthPriceClose as (
  SELECT
    DATE_TRUNC('day', minute) as day,
    price AS osqth_close
  FROM
    prices.usd
  WHERE (blockchain = 'ethereum' AND symbol = 'oSQTH')
    AND (DATE_TRUNC('day', minute) >= CAST('2022-10-02' AS TIMESTAMP))
    AND (hour(minute) = 23 AND minute(minute) = 59)
),
poolEthOsqth AS (
  SELECT
    date_trunc('day', evt_block_time) as day,
    date_trunc('minute', evt_block_time) as minute,
    evt_block_number as block_number,
    cast(amount as DOUBLE) / 1e18 as liquidity,
    tickLower,
    tickUpper
  FROM uniswap_v3_ethereum.Pair_evt_Mint
  WHERE owner = 0x12804580C15F4050dda61D44AFC94623198848bC AND contract_address = 0x82c427AdFDf2d245Ec51D8046b41c4ee87F0d29C
),
withdrawsPoolEthOsqth AS (
  SELECT
    date_trunc('day', evt_block_time) as day,
    evt_block_number as block_number,
    -1 * cast(amount as DOUBLE) / 1e18 as liquidity
  FROM uniswap_v3_ethereum.Pair_evt_Burn
  WHERE owner = 0x12804580C15F4050dda61D44AFC94623198848bC AND contract_address = 0x82c427AdFDf2d245Ec51D8046b41c4ee87F0d29C
  AND amount > cast(0 as uint256)
),
all_liquidityPoolEthOsqth AS (
  SELECT day, liquidity FROM poolEthOsqth
  UNION ALL
  SELECT day, liquidity FROM withdrawsPoolEthOsqth
),
last_poolEthOsqth_transactions AS (
  SELECT *
  FROM (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY day ORDER BY minute DESC) as rn
    FROM poolEthOsqth
  ) t
  WHERE t.rn = 1
),
poolEthOsqthDailyL AS (
  SELECT
    a.day,
    SUM(a.liquidity) OVER (ORDER BY a.day) AS liquidity,
    l.minute,
    l.tickLower,
    l.tickUpper
  FROM (
    SELECT day, SUM(liquidity) as liquidity
    FROM all_liquidityPoolEthOsqth
    GROUP BY day
  ) a
  LEFT JOIN last_poolEthOsqth_transactions l ON a.day = l.day
),
ethInitialPrice as (
  SELECT price AS eth_initial, minute
  FROM prices.usd
  WHERE (blockchain = 'ethereum' AND symbol = 'WETH') AND date_trunc('minute', minute) in (SELECT DISTINCT minute FROM poolEthOsqth)
),
osqthInitialPrice as (
  SELECT price AS osqth_initial, minute
  FROM prices.usd
  WHERE (blockchain = 'ethereum' AND symbol = 'oSQTH') AND date_trunc('minute', minute) in (SELECT DISTINCT minute FROM poolEthOsqth)
),
poolEthOsqthDaily as (
  SELECT 
    ethPriceClose.day as day,
    osqthPriceClose.osqth_close as osqth_close,
    ethPriceClose.eth_close as eth_close,
    (osqthPriceClose.osqth_close/ethPriceClose.eth_close) as close_price,
    (osqthInitialPrice.osqth_initial/ethInitialPrice.eth_initial) as initial_price,
    (poolEthOsqthDailyL.liquidity) as liquidity,
    (1/POW(1.0001, poolEthOsqthDailyL.tickLower)) as tickUpper,
    (1/POW(1.0001, poolEthOsqthDailyL.tickUpper)) as tickLower
  FROM ethPriceClose
  left JOIN osqthPriceClose ON ethPriceClose.day = osqthPriceClose.day
  left JOIN poolEthOsqthDailyL ON ethPriceClose.day = poolEthOsqthDailyL.day
  left JOIN ethInitialPrice ON ethInitialPrice.minute = poolEthOsqthDailyL.minute
  left JOIN osqthInitialPrice ON osqthInitialPrice.minute = poolEthOsqthDailyL.minute
),
poolEthOsqthDailyFilled AS (
  SELECT
    day,
    osqth_close,
    eth_close,
    close_price,
    MAX(initial_price) OVER (PARTITION BY grouper1) AS initial_price,
    MAX(liquidity) OVER (PARTITION BY grouper2) AS liquidity,
    MAX(tickLower) OVER (PARTITION BY grouper3) AS tickLower,
    MAX(tickUpper) OVER (PARTITION BY grouper4) AS tickUpper
  FROM (
    SELECT
      day,
      osqth_close,
      eth_close,
      close_price,
      initial_price,
      liquidity,
      tickLower,
      tickUpper,
      COUNT(initial_price) OVER (ORDER BY day) AS grouper1,
      COUNT(liquidity) OVER (ORDER BY day) AS grouper2,
      COUNT(tickLower) OVER (ORDER BY day) AS grouper3,
      COUNT(tickUpper) OVER (ORDER BY day) AS grouper4
    FROM poolEthOsqthDaily) AS grouped ORDER BY day
),
poolEthOsqthDailyValue as (
  SELECT
      day,
      osqth_close,
      CASE
          WHEN close_price >= initial_price THEN
              CASE
                  WHEN close_price <= tickUpper THEN liquidity * (2 * SQRT(close_price) - SQRT(tickLower) - close_price / SQRT(tickUpper))
                  ELSE liquidity * (SQRT(tickUpper) - SQRT(tickLower))
              END
          ELSE
              CASE
                  WHEN close_price <= tickLower THEN close_price * liquidity * (1 / SQRT(tickLower) - 1 / SQRT(tickUpper))
                  ELSE liquidity * (2 * SQRT(close_price) - SQRT(tickLower) - close_price / SQRT(tickUpper))
              END
      END AS tbp2
  FROM poolEthOsqthDailyFilled
),
poolEthUsdc AS (
  SELECT
    date_trunc('day', evt_block_time) as day,
    date_trunc('minute', evt_block_time) as minute,
    evt_block_number as block_number,
    cast(amount as DOUBLE) / 1e12 as liquidity,
    tickLower,
    tickUpper
  FROM uniswap_v3_ethereum.Pair_evt_Mint
  WHERE owner = 0x12804580C15F4050dda61D44AFC94623198848bC AND contract_address = 0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8
),
withdrawsPoolEthUsdc AS (
  SELECT
    date_trunc('day', evt_block_time) as day,
    evt_block_number as block_number,
    -1 * cast(amount as DOUBLE) / 1e12 as liquidity
  FROM uniswap_v3_ethereum.Pair_evt_Burn
  WHERE owner = 0x12804580C15F4050dda61D44AFC94623198848bC AND contract_address = 0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8
  AND amount > cast(0 as uint256)
),
all_liquidityPoolEthUsdc AS (
  SELECT day, liquidity FROM poolEthUsdc
  UNION ALL
  SELECT day, liquidity FROM withdrawsPoolEthUsdc
),
last_poolEthUsdc_transactions AS (
  SELECT *
  FROM (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY day ORDER BY minute DESC) as rn
    FROM poolEthUsdc
  ) t
  WHERE t.rn = 1
),
poolEthUsdcDailyL AS (
  SELECT
    a.day,
    SUM(a.liquidity) OVER (ORDER BY a.day) AS liquidity,
    l.minute,
    l.tickLower,
    l.tickUpper
  FROM (
    SELECT day, SUM(liquidity) as liquidity
    FROM all_liquidityPoolEthUsdc
    GROUP BY day
  ) a
  LEFT JOIN last_poolEthUsdc_transactions l ON a.day = l.day
),
poolEthUsdcDaily as (
  SELECT 
    ethPriceClose.day as day,
    ethPriceClose.eth_close as eth_close,
    ethInitialPrice.eth_initial as eth_initial,
    (poolEthUsdcDailyL.liquidity) as liquidity,
    (1e12/POW(1.0001, poolEthUsdcDailyL.tickLower)) as tickUpper,
    (1e12/POW(1.0001, poolEthUsdcDailyL.tickUpper)) as tickLower
  FROM ethPriceClose
  left JOIN poolEthUsdcDailyL ON ethPriceClose.day = poolEthUsdcDailyL.day
  left JOIN ethInitialPrice ON ethInitialPrice.minute = poolEthUsdcDailyL.minute
),
poolEthUsdcDailyFilled AS (
  SELECT
    day,
    eth_close,
    MAX(eth_initial) OVER (PARTITION BY grouper1) AS eth_initial,
    MAX(liquidity) OVER (PARTITION BY grouper2) AS liquidity,
    MAX(tickLower) OVER (PARTITION BY grouper3) AS tickLower,
    MAX(tickUpper) OVER (PARTITION BY grouper4) AS tickUpper
  FROM (
    SELECT
      day,
      eth_close,
      eth_initial,
      liquidity,
      tickLower,
      tickUpper,
      COUNT(eth_initial) OVER (ORDER BY day) AS grouper1,
      COUNT(liquidity) OVER (ORDER BY day) AS grouper2,
      COUNT(tickLower) OVER (ORDER BY day) AS grouper3,
      COUNT(tickUpper) OVER (ORDER BY day) AS grouper4
    FROM poolEthUsdcDaily
  ) AS grouped ORDER BY day
),
poolEthUsdcDailyValue as (
  SELECT
    day,
    eth_close,
    CASE
      WHEN eth_close >= eth_initial THEN
          CASE
              WHEN eth_close <= tickUpper THEN liquidity * (2 * SQRT(eth_close) - SQRT(tickLower) - eth_close / SQRT(tickUpper)) / eth_close
              ELSE liquidity * (SQRT(tickUpper) - SQRT(tickLower)) / eth_close
          END
      ELSE
          CASE
              WHEN eth_close <= tickLower THEN eth_close * liquidity * (1 / SQRT(tickLower) - 1 / SQRT(tickUpper)) / eth_close
              ELSE liquidity * (2 * SQRT(eth_close) - SQRT(tickLower) - eth_close / SQRT(tickUpper)) / eth_close
          END
    END AS tbp1
  from poolEthUsdcDailyFilled
),
totalSupplyEvents AS (
  SELECT
    date_trunc('day', evt_block_time) AS day,
    CASE
      WHEN "to" = 0x0000000000000000000000000000000000000000 THEN -CAST(value as INT256)
      ELSE CAST(value as INT256)
    END AS value
  FROM erc20_ethereum.evt_Transfer
  WHERE
    contract_address = 0x6d4CA1177087924edfE0908ef655169EA766FDc3
    AND ("to" = 0x0000000000000000000000000000000000000000 OR "from" = 0x0000000000000000000000000000000000000000)
),
totalSupply AS (
  SELECT
    day,
    SUM(value) OVER (ORDER BY day) AS totalSupply
  FROM (
      SELECT day, SUM(value) / 1e18 AS value
      FROM totalSupplyEvents
      GROUP BY day
      ORDER BY day
  ) ORDER BY day
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
    day,
    SUM(value) OVER (ORDER BY day) AS treasuryBalanceWETH
  FROM (
    SELECT day, SUM(value) as value
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
    day,
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
    day,
    SUM(value) OVER (ORDER BY day) AS treasuryBalanceOSQTH
  FROM (
    SELECT
      day,
      SUM(value) as value
    from allEventsOSQTH
    GROUP BY day
  )
),
combined AS (
  select 
    poolEthOsqthDailyValue.day as day,
    poolEthOsqthDailyValue.osqth_close as osqth_close,
    poolEthUsdcDailyValue.eth_close as eth_close,
    poolEthOsqthDailyValue.tbp2 as tbp2,
    poolEthUsdcDailyValue.tbp1 as tbp1,
    totalSupply.totalSupply as totalSupply,
    treasuryBalanceWETH.treasuryBalanceWETH / 1e18 as treasuryBalanceWETH,
    treasuryBalanceUSDC.treasuryBalanceUSDC / 1e6 as treasuryBalanceUSDC,
    treasuryBalanceOSQTH.treasuryBalanceOSQTH / 1e18 as treasuryBalanceOSQTH
  from poolEthOsqthDailyValue
  left join poolEthUsdcDailyValue on poolEthOsqthDailyValue.day = poolEthUsdcDailyValue.day
  left join totalSupply on poolEthOsqthDailyValue.day = totalSupply.day
  left join treasuryBalanceWETH on poolEthOsqthDailyValue.day = treasuryBalanceWETH.day
  left join treasuryBalanceUSDC on poolEthOsqthDailyValue.day = treasuryBalanceUSDC.day
  left join treasuryBalanceOSQTH on poolEthOsqthDailyValue.day = treasuryBalanceOSQTH.day
),
filled AS (
  SELECT
    day,
    osqth_close,
    eth_close,
    tbp1,
    tbp2,
    MAX(totalSupply) OVER (PARTITION BY grouper1) AS tS,
    MAX(treasuryBalanceWETH) OVER (PARTITION BY grouper2) AS tbW,
    MAX(treasuryBalanceUSDC) OVER (PARTITION BY grouper3) AS tBU,
    MAX(treasuryBalanceOSQTH) OVER (PARTITION BY grouper4) AS tbO
  FROM (
    SELECT
      day,
      osqth_close,
      eth_close,
      tbp1,
      tbp2,
      totalSupply,
      treasuryBalanceWETH,
      treasuryBalanceUSDC,
      treasuryBalanceOSQTH,
      COUNT(totalSupply) OVER (ORDER BY day) AS grouper1,
      COUNT(treasuryBalanceWETH) OVER (ORDER BY day) AS grouper2,
      COUNT(treasuryBalanceUSDC) OVER (ORDER BY day) AS grouper3,
      COUNT(treasuryBalanceOSQTH) OVER (ORDER BY day) AS grouper4
    FROM combined
  ) AS grouped ORDER BY day
),
calculated as (
  SELECT
    *,
    (100*((tbW + tBU/eth_close + osqth_close*tbO/eth_close + tbp1 + tbp2)/tS-1)) AS performance,
    (tbW*eth_close + tBU + osqth_close*tbO + tbp1*eth_close + tbp2*eth_close) AS tvl
  FROM filled
)
SELECT * from calculated