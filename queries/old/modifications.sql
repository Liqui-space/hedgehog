WITH
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
  rebalancesFilters as (
    SELECT call_tx_hash as block_number
    FROM liqui_hedgehog_auction_v1_ethereum.VaultAuction_call_timeRebalance
    WHERE call_success = true
    UNION
    SELECT call_block_number as block_number
    FROM liqui_hedgehog_auction_v1_ethereum.VaultAuction_call_priceRebalance
    WHERE call_success = true
    UNION
    SELECT call_block_number as block_number
    FROM liqui_hedgehog_auction_v2_ethereum.VaultAuction_call_timeRebalance
    WHERE call_success = true
    UNION
    SELECT call_block_number as block_number
    FROM liqui_hedgehog_auction_v2_ethereum.VaultAuction_call_priceRebalance
    WHERE call_success = true
  ),
  rebalances as (
    SELECT r.*
    FROM rebalancesRaw AS r
    INNER JOIN rebalancesFilters AS f
    ON r.block_number = f.block_number
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
  )
SELECT * FROM maxAmountsTB
