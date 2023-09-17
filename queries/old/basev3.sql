WITH
  sceleton AS (
    SELECT
      DATE_TRUNC('day', minute) as day
    FROM
      prices.usd
    WHERE blockchain = 'ethereum' AND symbol = 'WETH'
      AND (DATE_TRUNC('day', minute) >= CAST('2022-10-01' AS TIMESTAMP))
    GROUP BY DATE_TRUNC('day', minute)
  ),
  poolEthUsdcMints as (
    SELECT
      date_trunc('day', evt_block_time) as day,
      date_trunc('minute', evt_block_time) as block_time,
      cast(amount1 as DOUBLE) / 1e18 as amountWeth0,
      cast(amount0 as DOUBLE) / 1e6 as amountUSDC
    FROM
      uniswap_v3_ethereum.Pair_evt_Mint
    WHERE owner = 0x12804580C15F4050dda61D44AFC94623198848bC AND contract_address = 0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8
  ),
  ethPrice as (
    SELECT price AS eth, minute
    FROM prices.usd
    WHERE (blockchain = 'ethereum' AND symbol = 'WETH') AND date_trunc('minute', minute) in (SELECT DISTINCT block_time FROM poolEthUsdcMints)
  ),
  osqthPrice as (
    SELECT price AS osqth, minute
    FROM prices.usd
    WHERE (blockchain = 'ethereum' AND symbol = 'oSQTH') AND date_trunc('minute', minute) in (SELECT DISTINCT block_time FROM poolEthUsdcMints)
  ),
  poolEthOsqthMints as (
    SELECT
      date_trunc('day', evt_block_time) as day,
      date_trunc('minute', evt_block_time) as block_time,
      cast(amount0 as DOUBLE) / 1e18 as amountWeth1,
      cast(amount1 as DOUBLE) / 1e18 as amountOSQTH
    FROM
      uniswap_v3_ethereum.Pair_evt_Mint
    WHERE owner = 0x12804580C15F4050dda61D44AFC94623198848bC AND contract_address = 0x82c427AdFDf2d245Ec51D8046b41c4ee87F0d29C
  ),
  combinedPools AS (
    SELECT
        poolEthUsdcMints.day,
        poolEthUsdcMints.block_time, 
        (poolEthUsdcMints.amountWeth0 + poolEthOsqthMints.amountWeth1 + poolEthOsqthMints.amountOSQTH*osqthPrice.osqth/ethPrice.eth + poolEthUsdcMints.amountUSDC/ethPrice.eth) as tvlPools
    FROM poolEthUsdcMints
    JOIN poolEthOsqthMints ON poolEthUsdcMints.block_time = poolEthOsqthMints.block_time
    left JOIN ethPrice ON poolEthUsdcMints.block_time = ethPrice.minute
    left JOIN osqthPrice ON poolEthUsdcMints.block_time = osqthPrice.minute
  ),
  tvlPoolsDays as (
    SELECT day, tvlPools
    FROM (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY day ORDER BY block_time DESC) as row_num
      FROM combinedPools
    ) t
    WHERE row_num = 1
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
  tvlWETHDays AS (
    SELECT
      day,
      SUM(value) OVER (ORDER BY day) AS tvlWETH
    FROM (
      SELECT
        day,
        SUM(value) / 1e18 as value
      from allEventsWETH
      GROUP BY day
    )
  ),
  allEventsUSDC AS (
    SELECT
      date_trunc('day', evt_block_time) AS day,
      date_trunc('minute', evt_block_time) as block_time,
      -CAST(value as INT256) as value
    FROM
      erc20_ethereum.evt_Transfer
    WHERE
      contract_address = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
      AND "from" = 0x12804580C15F4050dda61D44AFC94623198848bC
    UNION ALL
    SELECT
      date_trunc('day', evt_block_time) AS day,
      date_trunc('minute', evt_block_time) as block_time,
      CAST(value as INT256) as value
    FROM
      erc20_ethereum.evt_Transfer
    WHERE
      contract_address = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
      AND "to" = 0x12804580C15F4050dda61D44AFC94623198848bC
  ),
  allEventsUSDCMinute AS (
    SELECT MAX(day) as day, block_time, SUM(value) / 1e6 AS value
    FROM allEventsUSDC
    GROUP BY block_time
  ),
  ethPrice1 as (
    SELECT price, minute
    FROM prices.usd
    WHERE (blockchain = 'ethereum' AND symbol = 'WETH') AND date_trunc('minute', minute) in (SELECT DISTINCT block_time FROM allEventsUSDCMinute)
  ),
  deltatvlUSDC AS (
    SELECT
        allEventsUSDCMinute.day,
        allEventsUSDCMinute.block_time,
        (allEventsUSDCMinute.value / ethPrice1.price) as value
    FROM allEventsUSDCMinute
    JOIN ethPrice1 ON allEventsUSDCMinute.block_time = ethPrice1.minute
  ),
  tvlUSDCDays AS (
    SELECT
      day,
      SUM(value) OVER (ORDER BY day) AS tvlUSDC
    FROM (
      SELECT day, SUM(value) AS value
      FROM deltatvlUSDC
      GROUP BY day
    )
  ),
  allEventsOSQTH AS (
    SELECT
      date_trunc('day', evt_block_time) AS day,
      date_trunc('minute', evt_block_time) as block_time,
      -CAST(value as INT256) as value
    FROM
      erc20_ethereum.evt_Transfer
    WHERE
      contract_address = 0xf1B99e3E573A1a9C5E6B2Ce818b617F0E664E86B
      AND "from" = 0x12804580C15F4050dda61D44AFC94623198848bC
    UNION ALL
    SELECT
      date_trunc('day', evt_block_time) AS day,
      date_trunc('minute', evt_block_time) as block_time,
      CAST(value as INT256) as value
    FROM
      erc20_ethereum.evt_Transfer
    WHERE
      contract_address = 0xf1B99e3E573A1a9C5E6B2Ce818b617F0E664E86B
      AND "to" = 0x12804580C15F4050dda61D44AFC94623198848bC
  ),
  allEventsOSQTHMinute AS (
    SELECT MAX(day) as day, block_time, SUM(value) / 1e18 AS value
    FROM allEventsOSQTH
    GROUP BY block_time
  ),
  osqthPrice2 as (
    SELECT price, minute
    FROM prices.usd
    WHERE (blockchain = 'ethereum' AND symbol = 'oSQTH') AND date_trunc('minute', minute) in (SELECT DISTINCT block_time FROM allEventsOSQTHMinute)
  ),
  ethPrice2 as (
    SELECT price, minute
    FROM prices.usd
    WHERE (blockchain = 'ethereum' AND symbol = 'WETH') AND date_trunc('minute', minute) in (SELECT DISTINCT block_time FROM allEventsOSQTHMinute)
  ),
  deltatvlOSQTH AS (
    SELECT
        allEventsOSQTHMinute.day,
        allEventsOSQTHMinute.block_time,
        (allEventsOSQTHMinute.value * osqthPrice2.price / ethPrice2.price) as value
    FROM allEventsOSQTHMinute
    JOIN ethPrice2 ON allEventsOSQTHMinute.block_time = ethPrice2.minute
    JOIN osqthPrice2 ON allEventsOSQTHMinute.block_time = osqthPrice2.minute
  ),
  tvlOSQTH AS (
    SELECT
      day,
      SUM(value) OVER (ORDER BY day) AS tvlOSQTH
    FROM (
      SELECT day, SUM(value) AS value
      FROM deltatvlOSQTH
      GROUP BY day
    )
  ),
  hhdeltaSupply AS (
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
  hhSupply AS (
    SELECT
      day,
      SUM(value) OVER (ORDER BY day) AS totalSupply
    FROM (
      SELECT day, SUM(value) / 1e18 AS value
      FROM hhdeltaSupply
      GROUP BY day
    )
  ),
  combined as (
    SELECT
      sceleton.day,
      tvlPoolsDays.tvlPools,
      tvlWETHDays.tvlWETH,
      tvlUSDCDays.tvlUSDC,
      tvlOSQTH.tvlOSQTH,
      hhSupply.totalSupply
    FROM sceleton
    left JOIN tvlPoolsDays ON sceleton.day = tvlPoolsDays.day
    left JOIN tvlWETHDays ON sceleton.day = tvlWETHDays.day
    left JOIN tvlUSDCDays ON sceleton.day = tvlUSDCDays.day
    left JOIN tvlOSQTH ON sceleton.day = tvlOSQTH.day
    left JOIN hhSupply ON sceleton.day = hhSupply.day
  ),
  filled_values AS (
    SELECT
      day,
      COALESCE(tvlPools, LAST_VALUE(tvlPools) IGNORE NULLS OVER (ORDER BY day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)) AS tvlPools,
      COALESCE(tvlWETH, LAST_VALUE(tvlWETH) IGNORE NULLS OVER (ORDER BY day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)) AS tvlWETH,
      COALESCE(tvlUSDC, LAST_VALUE(tvlUSDC) IGNORE NULLS OVER (ORDER BY day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)) AS tvlUSDC,
      COALESCE(tvlOSQTH, LAST_VALUE(tvlOSQTH) IGNORE NULLS OVER (ORDER BY day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)) AS tvlOSQTH,
      COALESCE(totalSupply, LAST_VALUE(totalSupply) IGNORE NULLS OVER (ORDER BY day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)) AS totalSupply
    FROM
      combined
  )
SELECT *, (100*(tvlPools+tvlWETH+tvlUSDC+tvlOSQTH)/totalSupply-100) as performance  from filled_values
