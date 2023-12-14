# Brewbean Coffee Shop Application
Setting Up the Database:

Create Database Tables: Use the BB_create and BB_Database_Populate SQL files to create and populate your database tables in SQL Developer.

Store Procedures and Functions: Copy and paste the script from below file into SQL Developer and run the script. This will create all the stored procedures and functions required for the tasks.

Setting Up the Express App:

Clone or Download the Project: If the project is hosted on a repository, clone it to your local machine. Alternatively, if you have a zipped version, download and extract it.

Install Dependencies: Navigate to the project's root directory in your command line or terminal, and run:

bash
Copy code
npm install
This command will install all the necessary Node.js packages defined in the package.json file.

Database Connection Configuration:

Navigate to the directory where the database configuration file is located (e.g., src/config).
Open the configuration file (e.g., dbConfig.js) and update it with your Oracle database username and password.
Running the App: In the project's root directory, run:

bash
Copy code
npm start
This command will start the Express server.

Tasks and Corresponding Components:

Task 1: Update Product Feature

Frontend: ProductFrame component (GUI)
Backend: UPDATE_BB_PRODUCT stored procedure
Task 2: Add New Product

Frontend: AddProductFrame component (GUI)
Backend: PROD_ADD_SP stored procedure
Task 3: Calculate Tax

Frontend: TaxCalculationFrame component (GUI)
Backend: TAX_COST_SP stored procedure
Task 4: Check Basket Status

Frontend: BasketStatusFrame component (GUI)
Backend: STATUS_SHIP_SP stored procedure
Task 5: Manage Basket

Frontend: BasketFrame component (GUI)
Backend: BASKET_ADD_SP stored procedure
Task 6: Check Sale Products

Frontend: CheckSaleProducts component (GUI)
Backend: CK_SALE_SF function
Reports:

Report 1: Stock Check Report

Frontend: Report1Frame component (GUI)
Backend: PL/SQL Block executed in com/daoimpl/BasketItemDaoImpl.java in the checkItemStock() method
Report 2: Total Purchase Report

Frontend: Report2Frame component (GUI)
Backend: TOT_PURCH_SF function


     --Allows employee to update an order staaus to be added to shipping information
  
  
     CREATE OR REPLACE PROCEDURE status_ship_sp (
              p_basketid IN bb_basketstatus.idbasket%TYPE,
              p_date     IN VARCHAR2,
              p_shipper  IN bb_basketstatus.shipper%TYPE,
              p_shipnum  IN bb_basketstatus.shippingnum%TYPE
          ) IS
          BEGIN
              INSERT INTO bb_basketstatus (
                  idstatus,
                  idbasket,
                  idstage,
                  dtstage,
                  shipper,
                  shippingnum
              ) VALUES (
                  bb_status_seq.NEXTVAL,
                  p_basketid,
                  3,
                  TO_DATE(p_date, 'YYYY-MM-DD'),
                  p_shipper,
                  p_shipnum
              );
              COMMIT;
          END status_ship_sp;
         BEGIN
          status_ship_sp(p_basketid => :basketId, 
            p_date => :date, 
            p_shipper => :shipper, 
            p_shipnum => :shipNum);
      END;
      
       --create gui and procedure to update product description
         CREATE OR REPLACE PROCEDURE upd_description_sp (
            p_productid   IN bb_product.idproduct%TYPE,
            p_description IN bb_product.description%TYPE
        ) IS
        BEGIN
            UPDATE bb_product
            SET description = p_description
            WHERE idproduct = p_productid;
            COMMIT;
        END;
        BEGIN
          upd_description_sp(p_productid => :productId,p_description => :productDescription);
      END ;
      CREATE OR REPLACE PROCEDURE tax_cost_sp (
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
    END;
    ---Enter new product
    CREATE OR REPLACE PROCEDURE prod_add_sp (
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
            END;
            
            BEGIN
        prod_add_sp(p_productname => :productName,
        p_description => :productDescription,
        p_productimage => :productImage,
        p_price => :productPrice,
        p_active => :productActive);
      END;
      --Adding items to Basket
      CREATE OR REPLACE PROCEDURE BASKET_ADD_SP (
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
        END;
      BEGIN
          BASKET_ADD_SP(p_productid => :productId, 
            p_basketid => :basketId, 
            p_price => :price, 
            p_quantity => :quantity, 
            p_size => :sizeCode, 
            p_form => :formCode);
      END;
      --Identifying sales product
      CREATE OR REPLACE FUNCTION CK_SALE_SF (
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
    END;
    --Report to show all items all in stock or not
    CREATE OR REPLACE PROCEDURE ck_instock_sp (
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
    END ck_instock_sp;
    
    --calculate Shoppers total spending
      CREATE OR REPLACE FUNCTION TOT_PURCH_SF (
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
      END TOT_PURCH_SF;
      --list of shoppers
    DECLARE
        v_msg NUMBER;
      BEGIN
        :v_msg := TOT_PURCH_SF(p_shopperid => :shopperId);
      END;
      
      SELECT
        bb_shopper.idshopper,
        SUM(bb_basket.total) AS total
      FROM
        bb_shopper
        FULL OUTER JOIN bb_basket ON bb_shopper.idshopper = bb_basket.idshopper
      GROUP BY
        bb_shopper.idshopper
