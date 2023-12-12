const express = require('express');
const router = express.Router();
const { connectToOracleDB } = require('../dbs');
const oracledb = require('oracledb');

//get product description form
router.get('/update-description', function (req, res, next) {
  res.render('updatedescription2', { title: 'Group 4' });
});
// update description
router.post('/update-description', async function (req, res, next) {
  try {
    const connection = await connectToOracleDB();
    const { productDescription, productId } = req.body;
    // const queryParams = {
    //   p_productid: { val: parseInt(productId) },
    //   p_description: { val: productDescription }
    // };
    // const result = await connection.execute(
    //   `UPDATE bb_product
    //   SET description = :p_description
    //   WHERE idproduct = :p_productid`,
    //   queryParams,
    //   // { autoCommit: true } // Commit the transaction automatically
    // );
    await connection.execute(
      `CREATE OR REPLACE PROCEDURE upd_description_sp (
            p_productid   IN bb_product.idproduct%TYPE,
            p_description IN bb_product.description%TYPE
        ) IS
        BEGIN
            UPDATE bb_product
            SET description = p_description
            WHERE idproduct = p_productid;
            COMMIT;
        END;`
    );
    const result = await connection.execute(
      `BEGIN
          upd_description_sp(p_productid => :productId,p_description => :productDescription);
      END;`,
      { productId, productDescription }
    );

    res.redirect('/product/list'); // Redirect to the product list page
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).send('Error updating product');
  }
});
// List products
router.get('/list', async function (req, res, next) {
  try {
    const connection = await connectToOracleDB();
    const result = await connection.execute('SELECT * FROM BB_PRODUCT');
    const products = result.rows.map(row => {
      const product = {};
      result.metaData.forEach((meta, index) => {
        product[meta.name] = row[index];
      });
      return product;
    });

    res.render('list', { title: 'Product List', products });
  } catch (error) {
    console.error('Error retrieving product list:', error);
    res.status(500).send('Error retrieving product list');
  }
});
// List products
router.get('/product-list', async function (req, res, next) {
  try {
    const { search } = req.query
    const connection = await connectToOracleDB();
    const sql = `SELECT * FROM BB_PRODUCT WHERE PRODUCTNAME LIKE '%${search}%'`
    const result = await connection.execute(sql);
    const products = result.rows.map(row => {
      const product = {};
      result.metaData.forEach((meta, index) => {
        product[meta.name] = row[index];
      });
      return product;
    });

    res.json({ products })
  } catch (error) {
    console.error('Error retrieving product list:', error);
    res.status(500).send('Error retrieving product list');
  }
});
// calc state tax
router.get('/calculate-tax', async function (req, res, next) {
  try {
    const { shopperState, basketSubtotal } = req.query;

    const connection = await connectToOracleDB();

    // const query = `SELECT TAXRATE FROM BB_TAX WHERE STATE = :taxState`;

    // const result = await connection.execute(query, { taxState: shopperState });

    // if (result.rows.length === 0) {
    //   return res.status(404).send('Tax rate not found for the specified state');
    // }

    // const taxRate = result.rows[0][0];
    await connection.execute(
      `CREATE OR REPLACE PROCEDURE tax_cost_sp (
        p_state     IN bb_tax.state%TYPE,
        p_subtotal  IN NUMBER,
        p_taxamount OUT NUMBER
    ) IS
    BEGIN
        SELECT p_subtotal * taxrate
        INTO p_taxamount
        FROM bb_tax
        WHERE state = p_state;
        COMMIT;
    EXCEPTION
        WHEN no_data_found THEN
            p_taxamount := 0;
    END;`
    );
    const result = await connection.execute(
      `BEGIN
          tax_cost_sp(p_state => :shopperState, p_subtotal => :basketSubtotal, p_taxamount => :v_tax);
      END;`,
      {
        shopperState,
        basketSubtotal,
        v_tax: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT, maxSize: 100 }
      }
    );
    console.log(result.outBinds);
    const taxAmount = result.outBinds.v_tax;
    res.json({ taxAmount });

  } catch (error) {
    console.error('Error calculating tax:', error);
    res.status(500).send('Error calculating tax');
  }
});

// Create a new product
router.post('/save', async function (req, res, next) {
  try {
    const connection = await connectToOracleDB();
    const { productImage, productName, productPrice, productDescription, productActive } = req.body;

    // const query = `INSERT INTO BB_PRODUCT (IDPRODUCT, PRODUCTNAME, DESCRIPTION, PRICE, ACTIVE)
    //                VALUES (:productId, :productName, :productDescription, :productPrice, :productActive)`;

    // const result = await connection.execute(query, {
    //   productId,
    //   productName,
    //   productDescription,
    //   productPrice,
    //   productActive,
    // }, { autoCommit: true });

    await connection.execute(
      `CREATE OR REPLACE PROCEDURE prod_add_sp (
                p_productname  IN bb_product.productname%TYPE,
                p_description  IN bb_product.description%TYPE,
                p_productimage IN bb_product.productimage%TYPE,
                p_price        IN bb_product.price%TYPE,
                p_active       IN bb_product.active%TYPE
            ) IS
                v_idproduct bb_product.idproduct%TYPE;
            BEGIN
                SELECT MAX(idproduct)
                INTO v_idproduct
                FROM bb_product;
                INSERT INTO bb_product (
                    idproduct,
                    productname,
                    description,
                    productimage,
                    price,
                    active
                ) VALUES (
                    v_idproduct + 1,
                    p_productname,
                    p_description,
                    p_productimage,
                    p_price,
                    p_active
                );
                COMMIT;
            END;`
    );
    const result = await connection.execute(
      `BEGIN
        prod_add_sp(p_productname => :productName,
        p_description => :productDescription,
        p_productimage => :productImage,
        p_price => :productPrice,
        p_active => :productActive);
      END;`,
      { productName, productDescription, productImage, productPrice, productActive }
    );

    res.redirect('/product/list'); // Redirect to the product list page

  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).send('Error creating product');
  }
});

// Update a product
router.post('/update/:productId', async function (req, res, next) {
  try {
    const connection = await connectToOracleDB();
    const { productName, productPrice } = req.body;
    const productId = req.params.productId;
    return { productName, productId }
    const query = `UPDATE TEST1
                   SET PRODUCT_NAME = :productName, PRODUCT_PRICE = :productPrice
                   WHERE PRODUCT_ID = :productId`;

    const result = await connection.execute(query, {
      productId,
      productName,
      productPrice,
    });

    await connection.execute('COMMIT'); // Commit the transaction

    res.redirect('/products/list'); // Redirect to the product list page

  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).send('Error updating product');
  }
});

// Delete a product
router.post('/delete/:productId', async function (req, res, next) {
  try {
    const connection = await connectToOracleDB();
    const productId = req.params.productId;

    const query = `DELETE FROM TEST1 WHERE PRODUCT_ID = :productId`;

    const result = await connection.execute(query, { productId });

    await connection.execute('COMMIT'); // Commit the transaction

    res.redirect('/products/list'); // Redirect to the product list page

  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).send('Error deleting product');
  }
});


// add to cart
router.post('/addtocart', async function (req, res, next) {
  try {
    const { productId, basketId, price, quantity, sizeCode, formCode } = req.body;

    const connection = await connectToOracleDB();

    // const query = `
    //   INSERT INTO bb_basketitem (idbasketitem, idproduct, idbasket, price, quantity, option1, option2)
    //   VALUES (bb_idbasketitem_seq.NEXTVAL, ${productId}, ${basketId}, ${price}, ${quantity}, ${sizeCode}, ${formCode})
    // `;
    await connection.execute(
      `CREATE OR REPLACE PROCEDURE BASKET_ADD_SP (
            p_basketid  IN bb_basketitem.idbasket%TYPE,
            p_productid IN bb_basketitem.idproduct%TYPE,
            p_price     IN bb_basketitem.price%TYPE,
            p_quantity  IN bb_basketitem.quantity%TYPE,
            p_size      IN bb_basketitem.option1%TYPE,
            p_form      IN bb_basketitem.option2%TYPE
        ) IS
        BEGIN
            INSERT INTO bb_basketitem (
                idbasketitem,
                idproduct,
                idbasket,
                price,
                quantity,
                option1,
                option2
            ) VALUES (
                bb_idbasketitem_seq.NEXTVAL,
                p_productid,
                p_basketid,
                p_price,
                p_quantity,
                p_size,
                p_form
            );
            COMMIT;
        END;`
    );
    const result = await connection.execute(
      `BEGIN
          BASKET_ADD_SP(p_productid => :productId, 
            p_basketid => :basketId, 
            p_price => :price, 
            p_quantity => :quantity, 
            p_size => :sizeCode, 
            p_form => :formCode);
      END;`,
      { productId, basketId, price, quantity, sizeCode, formCode }
    );

    res.status(201).send('Product added to cart successfully');

  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).send('Error adding to cart');
  }
});

router.get('/check-sale', async function (req, res, next) {
  try {
    const { productId, date } = req.query;
    const formattedDate = new Date(date).toISOString().slice(0, 10);
    const connection = await connectToOracleDB();
    // create stored procedure
    await connection.execute(
      `CREATE OR REPLACE FUNCTION CK_SALE_SF (
        p_productid IN bb_product.idproduct%TYPE,
        p_date      IN VARCHAR2
    ) RETURN VARCHAR2 IS
        v_start bb_product.salestart%TYPE;
        v_end   bb_product.saleend%TYPE;
    BEGIN
        SELECT salestart, saleend
        INTO v_start, v_end
        FROM bb_product
        WHERE idproduct = p_productid;
        IF ( TO_DATE(p_date, 'YYYY-MM-DD') >= v_start AND TO_DATE(p_date, 'YYYY-MM-DD') <= v_end ) THEN
            RETURN 'ON SALE!';
        ELSE
            RETURN 'Great Deal!';
        END IF;
    END;`
    );

    const result = await connection.execute(
      `BEGIN
        :v_msg := CK_SALE_SF(p_productid => :productId,p_date => :date);
      END;`,
      {
        productId,
        date: { val: formattedDate, type: oracledb.STRING, maxSize: 10 },
        v_msg: { type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: 100 }
      }
    );

    console.log(result.outBinds);
    res.json({ saleStatus: result.outBinds.v_msg });
  } catch (error) {
    console.error('Error checking saleStatus:', error);
    res.status(500).send('Error checking saleStatus');
  }
});

router.get('/check-stock', async function (req, res, next) {
  try {
    connection = await connectToOracleDB();//oracledb.getConnection(dbConfig);
    const { basketId } = req.query;
    await connection.execute(
      `CREATE OR REPLACE PROCEDURE ck_instock_sp (
        p_basketid IN bb_basketitem.idbasket%TYPE,
        p_msg OUT VARCHAR2
    ) IS
        CURSOR cur_basket IS
        SELECT bi.idbasket, bi.quantity, p.stock
        FROM bb_basketitem bi INNER JOIN bb_product p USING ( idproduct )
        WHERE bi.idbasket = p_basketid;
        lv_flag_txt CHAR(1) := 'Y';
    BEGIN
        FOR rec_basket IN cur_basket LOOP
            IF rec_basket.stock < rec_basket.quantity THEN
                lv_flag_txt := 'N';
            END IF;
        END LOOP;
    
        IF lv_flag_txt = 'Y' THEN
            --dbms_output.put_line('All items in stock!');
        p_msg:='All items in stock!';
        ELSIF lv_flag_txt = 'N' THEN
            --dbms_output.put_line('All items NOT in stock!');
        p_msg:='All items NOT in stock!';
        END IF;
        COMMIT;
    END ck_instock_sp;`
    );
    const result = await connection.execute(
      `DECLARE
        v_msg VARCHAR2(30);
      BEGIN
        ck_instock_sp(p_basketid => :basketId, p_msg => :v_msg);
      END;`,
      {
        basketId,
        v_msg: { type: oracledb.STRING, dir: oracledb.BIND_OUT }
      }
    );
    console.log(result.outBinds);
    res.json({ stockStatus: result.outBinds.v_msg });
  } catch (err) {
    console.error(err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});

router.get('/calculate-spending', async function (req, res, next) {
  // try {
  //   connection = await connectToOracleDB();
  //   const { shopperId } = req.query;
  //   // create procedure
  //   await connection.execute(
  //     `CREATE OR REPLACE FUNCTION TOT_PURCH_SF (
  //       p_shopperid IN bb_shopper.idshopper%TYPE
  //   ) RETURN NUMBER IS
  //       v_total bb_basket.total%TYPE;
  //   BEGIN
  //       SELECT SUM(bb_basket.total)
  //       INTO v_total
  //       FROM bb_shopper
  //           FULL OUTER JOIN bb_basket ON bb_shopper.idshopper = bb_basket.idshopper
  //       WHERE bb_shopper.idshopper = p_shopperid
  //       AND bb_basket.orderplaced = 1;

  //       IF v_total IS NULL THEN
  //           v_total:=0;
  //       END IF;

  //       RETURN v_total;
  //       COMMIT;
  //   END TOT_PURCH_SF;`
  //   );
  //   const result = await connection.execute(
  //     `DECLARE
  //       v_msg VARCHAR2(30);
  //     BEGIN
  //       TOT_PURCH_SF(p_shopperid => :shopperId, p_msg => :v_msg);
  //     END;`,
  //     {
  //       shopperId,
  //       v_msg: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
  //     }
  //   );
  //   console.log(result.outBinds);
  //   res.json({ stockStatus: result.outBinds.v_msg });
  // } catch (err) {
  //   console.error(err);
  // } finally {
  //   if (connection) {
  //     try {
  //       await connection.close();
  //     } catch (err) {
  //       console.error(err);
  //     }
  //   }
  // }
  try {
    connection = await connectToOracleDB();
    const { shopperId } = req.query;
    // create function
    await connection.execute(
      `CREATE OR REPLACE FUNCTION TOT_PURCH_SF (
        p_shopperid IN bb_shopper.idshopper%TYPE
      ) RETURN NUMBER IS
          v_total bb_basket.total%TYPE;
      BEGIN
          SELECT SUM(bb_basket.total)
          INTO v_total
          FROM bb_shopper
              FULL OUTER JOIN bb_basket ON bb_shopper.idshopper = bb_basket.idshopper
          WHERE bb_shopper.idshopper = p_shopperid
          AND bb_basket.orderplaced = 1;
  
          IF v_total IS NULL THEN
              v_total := 0;
          END IF;
  
          RETURN v_total;
      END TOT_PURCH_SF;`
    );

    const result = await connection.execute(
      `DECLARE
        v_msg NUMBER;
      BEGIN
        :v_msg := TOT_PURCH_SF(p_shopperid => :shopperId);
      END;`,
      {
        shopperId,
        v_msg: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
      }
    );

    console.log(result.outBinds);
    res.json({ totalSpending: result.outBinds.v_msg });
  } catch (err) {
    console.error(err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }

});
router.get('/list-spending', async function (req, res, next) {
  try {
    connection = await connectToOracleDB();
    const result = await connection.execute(
      `SELECT
        bb_shopper.idshopper,
        SUM(bb_basket.total) AS total
      FROM
        bb_shopper
        FULL OUTER JOIN bb_basket ON bb_shopper.idshopper = bb_basket.idshopper
      GROUP BY
        bb_shopper.idshopper`,
      [],
      { maxRows: 10 }
    );
    const spendingResult = result.rows.map(row => {
      const obj = {};
      result.metaData.forEach((meta, index) => {
        obj[meta.name] = row[index];
      });
      return obj;
    });
    console.log(result);
    res.json({ result: spendingResult });
  } catch (err) {
    console.error(err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});

router.get('/productslist', async (req, res) => {
  let connection;

  try {
    connection = await connectToOracleDB();
    const result = await connection.execute(
      `SELECT IDPRODUCT as id FROM bb_product`,
    );
    const products = result.rows.map(row => { return { id: row[0] } });
    res.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing database connection:', err);
      }
    }
  }
});

module.exports = router;