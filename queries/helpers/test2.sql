WITH 
    demo_data AS (
        SELECT 
            '2021-06-06' AS measured_on,
            NULL AS measurement,
            NULL AS value2
        UNION ALL 
        SELECT 
            '2021-06-07' AS measured_on,
            5 AS measurement,
            NULL AS value2
        UNION ALL 
        SELECT 
            '2021-06-08' AS measured_on,
            NULL AS measurement,
            NULL AS value2
        UNION ALL 
        SELECT 
            '2021-06-09' AS measured_on,
            NULL AS measurement,
            NULL AS value2
        UNION ALL 
        SELECT 
            '2021-05-22' AS measured_on,
            42 AS measurement,
            10 AS value2
        UNION ALL 
        SELECT 
            '2021-05-23' AS measured_on,
            42 AS measurement,
            20 AS value2
        UNION ALL 
        SELECT 
            '2021-05-25' AS measured_on,
            NULL AS measurement,
            NULL AS value2
        UNION ALL 
        SELECT 
            '2021-05-26' AS measured_on,
            11 AS measurement,
            30 AS value2
        UNION ALL 
        SELECT 
            '2021-05-27' AS measured_on,
            NULL AS measurement,
            NULL AS value2
        UNION ALL 
        SELECT 
            '2021-05-28' AS measured_on,
            NULL AS measurement,
            NULL AS value2
        UNION ALL 
        SELECT 
            '2021-07-01' AS measured_on,
            NULL AS measurement,
            NULL AS value2
        UNION ALL 
        SELECT 
            '2021-07-03' AS measured_on,
            NULL AS measurement,
            NULL AS value2
    )
SELECT
    measured_on,
    measurement,
    MAX(measurement) OVER (PARTITION BY grouper1) AS forward_filled_measurement,
    value2,
    MAX(value2) OVER (PARTITION BY grouper2) AS forward_filled_value2
FROM
    (
        SELECT
            measured_on,
            measurement,
            value2,
            COUNT(measurement) OVER (ORDER BY measured_on) AS grouper1,
            COUNT(value2) OVER (ORDER BY measured_on) AS grouper2
        FROM
            demo_data
    ) AS grouped
ORDER BY
    measured_on
