WITH
  ethPrice as (
    SELECT
      DATE_TRUNC('day', minute) as day1,
      AVG(price) AS eth_daily
    FROM
      prices.usd
    WHERE
      (
        blockchain = 'ethereum'
        AND symbol = 'WETH'
      )
      AND (DATE_TRUNC('day', minute) >= CAST('2022-10-02' AS TIMESTAMP))
    GROUP BY DATE_TRUNC('day', minute)
  ),
  osqthPrice as (
    SELECT
      DATE_TRUNC('day', minute) as day2,
      AVG(price) AS osqth_daily
    FROM
      prices.usd
    WHERE
      (
        blockchain = 'ethereum'
        AND symbol = 'oSQTH'
      )
      AND (DATE_TRUNC('day', minute) >= CAST('2022-10-02' AS TIMESTAMP))
    GROUP BY DATE_TRUNC('day', minute)
  ),
  rebalancesRaw as (
    SELECT
      date_trunc('day', call_block_time) as day,
      'rebalance' as "type",
      call_block_number as block_number,
      cast(output_0 as DOUBLE) / 1e18 as amountWeth,
      cast(output_1 as DOUBLE) / 1e6 as amountUSDC,
      cast(output_2 as DOUBLE) / 1e18 as amountOSQTH
    FROM
      liqui_hedgehog_math_v1_ethereum.VaultMath_call_getTotalAmounts
    WHERE call_success = true
    UNION
    SELECT
      date_trunc('day', call_block_time) as day,
      'rebalance' as "type",
      call_block_number as block_number,
      cast(output_0 as DOUBLE) / 1e18 as amountWeth,
      cast(output_1 as DOUBLE) / 1e6 as amountUSDC,
      cast(output_2 as DOUBLE) / 1e18 as amountOSQTH
    FROM
      liqui_hedgehog_math_v2_ethereum.VaultMathV2_call_getTotalAmounts
    WHERE call_success = true
    UNION
    SELECT
      date_trunc('day', call_block_time) as day,
      'rebalance' as "type",
      call_block_number as block_number,
      cast(output_0 as DOUBLE) / 1e18 as amountWeth,
      cast(output_1 as DOUBLE) / 1e6 as amountUSDC,
      cast(output_2 as DOUBLE) / 1e18 as amountOSQTH
    FROM
      liqui_hedgehog_math_v3_ethereum.VaultMathV3_call_getTotalAmounts
    WHERE call_success = true
  ),
  poolEthUsdcMints as (
    SELECT
      date_trunc('day', evt_block_time) as day,
      evt_block_number as block_number,
      amount0 as amountWeth0,
      amount1 as amountUSDC
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
  deposits as (
    SELECT
        date_trunc('day', call_block_time) as day,
        'deposit' as "type",
        call_block_number as block_number,
        cast(amountEth as DOUBLE) / 1e18 as amountWeth,
        cast(amountUsdc as DOUBLE) / 1e6 as amountUSDC,
        cast(amountOsqth as DOUBLE) / 1e18 as amountOSQTH
    from
        liqui_hedgehog_ethereum.Vault_call_deposit
  ),
  withdraws as (
    SELECT
        date_trunc('day', evt_block_time) as day,
        'deposit' as "type",
        evt_block_number as block_number,
        -cast(amountEth as DOUBLE) / 1e18 as amountWeth,
        -cast(amountUsdc as DOUBLE) / 1e6 as amountUSDC,
        -cast(amountOsqth as DOUBLE) / 1e18 as amountOSQTH
    from
        liqui_hedgehog_ethereum.Vault_evt_Withdraw
  ),
  allAmount as (
    SELECT day, "type", block_number, amountWeth, amountUSDC, amountOSQTH FROM rebalances
    UNION SELECT * FROM deposits
    UNION SELECT * FROM withdraws
    ORDER BY block_number desc
  ),
  allAmountSums AS (
    SELECT
      *,
      SUM(CASE WHEN type = 'deposit' THEN amountUSDC ELSE 0 END)
      OVER (ORDER BY block_number ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS amountUSDC_sum,
      SUM(CASE WHEN type = 'deposit' THEN amountWeth ELSE 0 END)
      OVER (ORDER BY block_number ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS amountWeth_sum,
      SUM(CASE WHEN type = 'deposit' THEN amountOSQTH ELSE 0 END)
      OVER (ORDER BY block_number ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS amountOSQTH_sum
    FROM allAmount
  ),
  allAmountLagged as (
    SELECT
      day,
      block_number,
      CASE
        WHEN type = 'rebalance' THEN amountWeth
        ELSE amountWeth_sum
      END AS amountWeth,
      CASE
        WHEN type = 'rebalance' THEN amountUSDC
        ELSE amountUSDC_sum
      END AS amountUSDC,
      CASE
        WHEN type = 'rebalance' THEN amountOSQTH
        ELSE amountOSQTH_sum
      END AS amountOSQTH
    FROM allAmountSums
  ),
  maxAmountsTB as (
    SELECT 
      t1.day,
      t1.block_number,
      t1.amountWeth,
      t1.amountUSDC,
      t1.amountOSQTH
    FROM allAmountLagged t1
    INNER JOIN (
      SELECT day, MAX(block_number) AS max_day_time
      FROM allAmountLagged
      GROUP BY day
    ) t2 ON t1.day = t2.day AND t1.block_number = t2.max_day_time
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
      day as day4,
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
  combined AS (
    select * from ethPrice tb1
    left join osqthPrice tb2 on tb1.day1 = tb2.day2
    left join maxAmountsTB tb3 on tb1.day1 = tb3.day
    left join maxTotalSupply tb4 on tb1.day1 = tb4.day4
  ),
  prettified AS (
    select day1 as day, eth_daily, osqth_daily, amountWeth, amountUSDC, amountOSQTH, totalSupply FROM combined ORDER BY day ASC
  ),
  filled as (
    SELECT
      day,
      eth_daily,
      osqth_daily,
      totalSupply,
      COALESCE(
        amountWeth,
        FIRST_VALUE(amountWeth) OVER (PARTITION BY grp ORDER BY day ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING)
      ) AS filled_amountWeth,
      COALESCE(
        amountUSDC,
        FIRST_VALUE(amountUSDC) OVER (PARTITION BY grp ORDER BY day ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING)
      ) AS filled_amountUSDC,
      COALESCE(
        amountOSQTH,
        FIRST_VALUE(amountOSQTH) OVER (PARTITION BY grp ORDER BY day ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING)
      ) AS filled_amountOSQTH
    FROM (
      SELECT
        *,
        COUNT(amountWeth) OVER (ORDER BY day) AS grp_amountWeth,
        COUNT(amountUSDC) OVER (ORDER BY day) AS grp_amountUSDC,
        COUNT(amountOSQTH) OVER (ORDER BY day) AS grp_amountOSQTH
      FROM
        prettified
    ) t,
    LATERAL (
      SELECT
        GREATEST(grp_amountWeth, grp_amountUSDC, grp_amountOSQTH) AS grp
    ) sub
  ),
  filled2 as (
    SELECT
      day,
      eth_daily,
      osqth_daily,
      filled_amountOSQTH as amountOSQTH,
      filled_amountWeth as amountWeth,
      filled_amountUSDC as amountUSDC,
      COALESCE(
        totalSupply,
        FIRST_VALUE(totalSupply) OVER (PARTITION BY grp ORDER BY day ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING)
      ) AS filled_totalSupply
    FROM (
      SELECT
        *,
        COUNT(totalSupply) OVER (ORDER BY day) AS grp_totalSupply
      FROM
        filled
    ) t,
    LATERAL (
      SELECT
        GREATEST(grp_totalSupply) AS grp
    ) sub
  ),
  results as (
    SELECT day, ((amountWeth + amountUSDC/eth_daily + amountOSQTH * osqth_daily/eth_daily)) as body, filled_totalSupply as totalSupply FROM filled2
  )
SELECT day, body, totalSupply, (body/totalSupply-1)* 100 FROM results
