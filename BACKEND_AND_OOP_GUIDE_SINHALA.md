# Serendip Backend Architecture & OOP Concepts — සම්පූර්ණ තාක්ෂණික මාර්ගෝපදේශය (Sinhala & English Guide)

මෙම ලේඛනයෙන් **Serendip Multi-Vendor Marketplace** backend පද්ධතියේ ගෘහ නිර්මාණ ශිල්පය (Architecture), Domain Models, Object-Oriented Programming (OOP) සංකල්ප භාවිතය, Security, Database Schema සහ REST API ක්‍රියාකාරීත්වය පිළිබඳව සම්පූර්ණ පැහැදිලි කිරීමක් සිංහල සහ ඉංග්‍රීසි මිශ්‍රව (Bilingual Technical Guide) ඉදිරිපත් කෙරේ.

---

## පටුන (Table of Contents)
1. [පද්ධති හැඳින්වීම සහ Tech Stack (System Overview & Tech Stack)](#1-පද්ධති-හැඳින්වීම-සහ-tech-stack)
2. [Backend Architecture & Layered Design (පද්ධති නිර්මාණ ශිල්පය)](#2-backend-architecture--layered-design)
3. [OOP සංකල්ප Serendip Backend හි භාවිත කර ඇති ආකාරය (All OOP Concepts)](#3-oop-සංකල්ප-serendip-backend-හි-භාවිත-කර-ඇති-ආකාරය)
   - 3.1 [Inheritance (ප්‍රවේණිය / උරුම වීම)](#31-inheritance-ප්‍රවේණිය--උරුම-වීම)
   - 3.2 [Encapsulation (දත්ත සංවෘතකරණය සහ ආරක්ෂාව)](#32-encapsulation-දත්ත-සංවෘතකරණය-සහ-ආරක්ෂාව)
   - 3.3 [Polymorphism (බහුරූපතාවය)](#33-polymorphism-බහුරූපතාවය)
   - 3.4 [Abstraction (වියුක්තකරණය)](#34-abstraction-වියුක්තකරණය)
   - 3.5 [Object Relationships: Association, Aggregation & Composition](#35-object-relationships-association-aggregation--composition)
4. [OOP Design Patterns (නිර්මාණ රටා)](#4-oop-design-patterns)
5. [Multi-Vendor Checkout & Financial Logic (ඇණවුම් සහ ගෙවීම් ක්‍රියාවලිය)](#5-multi-vendor-checkout--financial-logic)
6. [Security & Role-Based Access Control (RBAC)](#6-security--role-based-access-control-rbac)
7. [REST API Endpoints සාරාංශය](#7-rest-api-endpoints-සාරාංශය)

---

## 1. පද්ධති හැඳින්වීම සහ Tech Stack

**Serendip** කියන්නේ multi-vendor e-commerce platform එකක් (Amazon හෝ Daraz වැනි). මෙහි විවිධ වෙළෙන්දන්ට (Sellers) තමන්ගේ භාණ්ඩ ලැයිස්තුගත කිරීමටත්, ගැණුම්කරුවන්ට (Buyers) එකම checkout එකකින් විවිධ sellers ලාගෙන් භාණ්ඩ මිලදී ගැනීමටත් හැකියාව ඇත.

### තාක්ෂණික මෙවලම් (Tech Stack):
- **Programming Language**: **Java 21 (LTS)** — Modern records, pattern matching, switch expressions, sealed hierarchies භාවිත වේ.
- **Backend Framework**: **Spring Boot 3.3.5** (Spring Data JPA, Spring Security, Spring Web).
- **ORM & Persistence**: **Hibernate 6.5** & Spring Data JPA.
- **Database**: **PostgreSQL** (Supabase Cloud Transaction Pooler හරහා port 6543 මගින් සම්බන්ධ වේ).
- **Database Migrations**: **Flyway 10.x** (`V1__init_marketplace_schema.sql`).
- **Connection Pool**: **HikariCP** (Cloud connection limit වලට ගැළපෙන සේ උපරිම pool size 5ක් ලෙස සකසා ඇත).
- **Security**: **Spring Security 6.3** සමග **BCrypt** (12 rounds password hashing).
- **Build Tool & Container**: Maven 3.9+ සහ Docker (Multi-stage Alpine JRE 21).

---

## 2. Backend Architecture & Layered Design

Serendip backend එක **4-Tier Layered Architecture** එකක් මත Domain-Driven Design (DDD) මූලධර්ම අනුගමනය කරමින් නිර්මාණය කර ඇත:

```
[ Client (React Frontend / Mobile / Postman) ]
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ 1. Presentation Layer (Controllers)                      │
│    - AuthController, UserController, ProductController   │
│    - CartController, OrderController, ReviewController   │
│    - Request DTOs validation (@Valid) & JSON Responses   │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│ 2. Security & Exception Layer                            │
│    - SecurityConfig (RBAC, CORS), CustomUserDetailsService│
│    - GlobalExceptionHandler (@RestControllerAdvice)      │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│ 3. Service Layer (Business Logic & Transactions)         │
│    - UserService, ProductService, CartService            │
│    - OrderService, ReviewService                         │
│    - Transaction Boundaries (@Transactional)             │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│ 4. Domain & Persistence Layer                            │
│    - Rich Domain Entities (User, Product, Order, etc.)   │
│    - Spring Data JPA Repositories (JpaRepository<T, ID>) │
│    - Database: PostgreSQL (Supabase) via Flyway          │
└──────────────────────────────────────────────────────────┘
```

---

## 3. OOP සංකල්ප Serendip Backend හි භාවිත කර ඇති ආකාරය

Serendip backend එකේ සෑම මූලික OOP සංකල්පයක්ම (Pillars of OOP) නිවැරදිව සහ පූර්ණව ක්‍රියාත්මක කර ඇත.

---

### 3.1 Inheritance (ප්‍රවේණිය / උරුම වීම)

Inheritance මගින් parent class එකක ඇති ගුණාංග (attributes) සහ ක්‍රියාකාරකම් (methods) child class එකක් වෙත උරුම කරදීම ("is-a" relationship) සිදුවේ.

#### A. JPA Joined-Table Entity Inheritance
Database එකේ table inheritance නිරූපණය කිරීමට JPA හි `@Inheritance(strategy = InheritanceType.JOINED)` භාවිතා කර ඇත:

```
                  ┌──────────────────────┐
                  │      User.java       │  (Base Abstract Class)
                  │  - id, email, pass   │
                  └──────────┬───────────┘
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
┌──────────────────┐┌──────────────────┐┌──────────────────┐
│    Buyer.java    ││   Seller.java    ││    Admin.java    │
│- deliveryAddress ││- shopName        ││- department      │
│- cart, orders    ││- commissionRate  ││                  │
└──────────────────┘└──────────────────┘└──────────────────┘
```

1. **Parent Entity**:
   - `User.java`: `public abstract class User` — සියලු පරිශීලකයින්ට පොදු වූ `id`, `email`, `passwordHash`, `fullName`, `phoneNumber`, `accountStatus`, `createdAt` මෙහි අඩංගු වේ.
2. **Child Entities (උරුම කරගත් classes)**:
   - `Buyer.java`: `public class Buyer extends User` — `User` ගේ සියලු ගුණාංග උරුම කරගන්නා අතර, `deliveryAddress`, `cart`, `orders`, `reviews` සහ checkout logic අලුතින් එක් කරයි.
   - `Seller.java`: `public class Seller extends User` — `User` ගේ සියලු ගුණාංග උරුම කරගනිමින් `shopName`, `shopDescription`, `originCity`, `commissionRate` (කොමිස් ප්‍රතිශතය), සහ තමන්ගේ නිෂ්පාදන (`products`) එක් කරයි.
   - `Admin.java`: `public class Admin extends User` — පද්ධති පාලනය සඳහා `department` විස්තර එක් කරයි.

#### B. Custom Exception Hierarchy (දෝෂ හැසිරවීමේ උරුමය)
Runtime errors ක්‍රමානුකූලව හසුරුවා ගැනීමට exception inheritance භාවිතා කර ඇත:

```
java.lang.RuntimeException
  └── BusinessRuleException.java
        ├── InsufficientStockException.java   (තොග මදි වූ විට)
        ├── InvalidOrderStateException.java  (අවලංගු order status මාරුවකදී)
        ├── InvalidRatingException.java      (Rating එක 1-5 න් පිට පැමිණි විට)
        └── ResourceNotFoundException.java   (දත්ත සොයාගත නොහැකි වූ විට)
```
- `BusinessRuleException extends RuntimeException`
- `InsufficientStockException extends BusinessRuleException`
- `InvalidOrderStateException extends BusinessRuleException`
- `InvalidRatingException extends BusinessRuleException`
- `ResourceNotFoundException extends BusinessRuleException`

`GlobalExceptionHandler` මගින් මෙම exceptions polymorphically අල්ලා ගෙන අදාළ HTTP Status code එක (`400 Bad Request`, `404 Not Found`) client වෙත ලබා දෙයි.

#### C. Interface Inheritance (`interface ... extends ...`)
Spring Data JPA හි `JpaRepository<T, ID>` generic interface එක extend කරමින් repository interfaces 11ක් සාදා ඇත:
1. `BuyerRepository extends JpaRepository<Buyer, Long>`
2. `SellerRepository extends JpaRepository<Seller, Long>`
3. `UserRepository extends JpaRepository<User, Long>`
4. `ProductRepository extends JpaRepository<Product, Long>`
5. `ShoppingCartRepository extends JpaRepository<ShoppingCart, Long>`
6. `OrderRepository extends JpaRepository<Order, Long>`
7. `SellerOrderRepository extends JpaRepository<SellerOrder, Long>`
8. `OrderItemRepository extends JpaRepository<OrderItem, Long>`
9. `PaymentRepository extends JpaRepository<Payment, Long>`
10. `ReviewRepository extends JpaRepository<Review, Long>`
11. `OrderStatusHistoryRepository extends JpaRepository<OrderStatusHistory, Long>`

#### D. Interface Implementations (`implements`)
Interface එකක කොන්ත්‍රාත්තුව සැබෑ ලෙස ක්‍රියාත්මක කරන classes 10ක්:
1. `CardPaymentMethod implements PaymentMethod`
2. `PayPalPaymentMethod implements PaymentMethod`
3. `BankTransferPaymentMethod implements PaymentMethod`
4. `MockPaymentMethod implements PaymentMethod`
5. `FixedRateCurrencyConverter implements CurrencyConverter`
6. `CustomUserDetailsService implements UserDetailsService`
7. `CustomUserPrincipal implements UserDetails`
8. `RestAccessDeniedHandler implements AccessDeniedHandler`
9. `RestAuthenticationEntryPoint implements AuthenticationEntryPoint`
10. `DataInitializer implements CommandLineRunner`

---

### 3.2 Encapsulation (දත්ත සංවෘතකරණය සහ ආරක්ෂාව)

Encapsulation කියන්නේ class එකක data (variables) පිටතින් කෙලින්ම වෙනස් කළ නොහැකි වන සේ සඟවා (`private`), පාලනය කළ හැකි methods (getters/setters/business methods) හරහා පමණක් පරිශීලනයට ඉඩ දීමයි.

#### 1. Private Fields සහ Access Control
Entities 13 හිම සියලු fields `private` හෝ `protected` ලෙස තබා ඇත. පිටතින් කිසිවෙකුට කෙලින්ම `product.stockQuantity = -5;` වැනි නීති විරෝධී අගයන් ඇතුළත් කළ නොහැක.

#### 2. Rich Domain Model (Anemic Model වෙනුවට)
Data වෙනස් කරන business rules, setters වෙනුවට entity එක ඇතුලෙන්ම ක්‍රියාත්මක වේ:
- `Product.java`:
  - `deductStock(int quantity)`: Quantity එක ධන අගයක්ද සහ ඇති තරම් තොග තිබේදැයි පරීක්ෂා කර තොගය අඩු කරයි. Stock එක 0 වූ විට ස්වයංක්‍රීයව `active = false` කරයි.
  - `replenishStock(int quantity)`: තොග නැවත පිරවූ විට `stockQuantity` වැඩි කර product එක නැවත `active = true` කරයි.
- `Buyer.java`:
  - `checkOut(PaymentMethod)`: Cart එක හිස්දැයි පරීක්ෂා කර, තොග අඩු කර, sellers ලා අනුව orders වෙන් කර payment method එක run කරයි.
- `ShoppingCart.java`:
  - `addItem()`, `removeItem()`, `calculateTotal()` මගින් cart එකේ අභ්‍යන්තර ලැයිස්තුව ආරක්ෂා කරයි.
- `SellerOrder.java`:
  - `calculateFinancials()`: කොමිස් මුදල සහ seller හට ගෙවිය යුතු ශුද්ධ මුදල (Net Payout) ගණනය කරයි.

#### 3. Java Records මගින් Immutability ලබා දීම
DTOs (Data Transfer Objects) 28ක් සඳහා Java `record` භාවිතා කර ඇත. Records වල fields `private final` වන බැවින් data වෙනස් කළ නොහැක (Immutable):
- උදාහරණ: `LoginRequest`, `CheckoutRequest`, `ProductResponse`, `CartResponse`, `OrderResponse` ආදිය.

---

### 3.3 Polymorphism (බහුරූපතාවය)

Polymorphism ("Many forms") කියන්නේ එකම method call එකකට විවිධ අවස්ථාවල විවිධ ආකාරයෙන් ප්‍රතිචාර දැක්වීමේ හැකියාවයි.

#### A. Runtime Polymorphism (Dynamic Method Dispatch & Method Overriding)
Interface එකක් හෝ parent class එකක් හරහා call කරන method එකක් runtime එකේදී අදාළ child object එකට අනුව ක්‍රියාත්මක වීම.

- **ගෙවීම් ක්‍රියාවලිය (Payment Processing)**:
  `OrderService.java` හිදී:
  ```java
  PaymentResult result = paymentMethod.pay(totalAmount, currency, orderNumber);
  ```
  මෙහි `paymentMethod` යනු `PaymentMethod` interface reference එකකි. Client තෝරාගත් ක්‍රමය අනුව runtime එකේදී dynamically ක්‍රියාත්මක වන්නේ:
  - `CardPaymentMethod.pay()` (කාඩ්පත් අංක සහ CVV පරීක්ෂාව)
  - `PayPalPaymentMethod.pay()` (PayPal ගිණුම් හරහා ගෙවීම)
  - `BankTransferPaymentMethod.pay()` (බැංකු තැන්පතු ස්ලිප් පරීක්ෂාව)
  - `MockPaymentMethod.pay()` (පරීක්ෂණ ගෙවීම)

- **සියලු `@Override` Methods**:
  - `Admin.getRole()`, `Buyer.getRole()`, `Seller.getRole()` — `UserRole` එක parent method එක override කර ලබා දෙයි.
  - `Product.equals()`, `Product.hashCode()`, `User.equals()`, `User.hashCode()` — `java.lang.Object` හි identity methods override කර ඇත.
  - `CustomUserDetailsService.loadUserByUsername()` — Spring Security interface method එක override කිරීම.

#### B. Compile-Time Polymorphism (Method Overloading)
එකම class එක තුළ එකම නම ඇති නමුත් parameter ගණන හෝ වර්ග වෙනස් methods පැවතීම:

1. `PaymentMethod.java`:
   - `pay(BigDecimal amount, String currency, String orderReference)`
   - `default pay(String orderReference, BigDecimal amount, String currencyCode)`
2. `Product.java`:
   - `createInLkr(name, priceLkr, stock, seller)` (parameters 4යි)
   - `createInLkr(name, category, description, priceLkr, stock, seller, weightGrams)` (parameters 7යි)
3. `Order.java`:
   - `public Order()`
   - `public Order(Buyer buyer)`
   - `public Order(String orderNumber, Buyer buyer, String shippingAddress, String paymentMethodName)`
4. `OrderService.java`:
   - `cancelOrder(Long id)`
   - `cancelOrder(Long id, String reason)`
5. `ProductService.java`:
   - `addProduct(...)` (image නැතිව)
   - `addProduct(...)` (image URL සහිතව)
6. `ReviewService.java`:
   - `addReview(buyerId, orderItemId, rating, comment)`
   - `addReviewForProduct(buyerId, productId, rating, comment)`

#### C. Parametric Polymorphism (Generics)
- `JpaRepository<T, ID>`: `User`, `Product`, `Order` ආදී ඕනෑම entity වර්ගයක් සඳහා generic persistence methods ලබා දීම.
- `Optional<T>`: `Optional<User>`, `Optional<Order>` ආදී null-safe container objects.
- `ResponseEntity<T>`: Controllers වලින් HTTP JSON response එක generic ලෙස ආවරණය කිරීම.

---

### 3.4 Abstraction (වියුක්තකරණය)

අභ්‍යන්තර සංකීර්ණ ක්‍රියාකාරීත්වය සඟවා (hiding complexity), පරිශීලකයාට අවශ්‍ය අත්‍යවශ්‍ය interface එකක් පමණක් ලබා දීම Abstraction වේ.

1. **Abstract Class `User`**:
   `User` class එක `abstract` කර ඇත. පද්ධතිය තුළ වියුක්ත "User" කෙනෙකු සෑදිය නොහැක (`new User()` කළ නොහැක). ඔහු අනිවාර්යයෙන්ම `Buyer`, `Seller` හෝ `Admin` කෙනෙකු විය යුතුය.
2. **Interface Contracts**:
   - `PaymentMethod`: `pay(...)` method එකෙන් මුදල් අය කරගන්නා ආකාරය service එකට අදාළ නැත (Stripe API ද, PayPal ද, Bank Transfer ද යන්න සඟවා ඇත).
   - `CurrencyConverter`: රුපියල් සහ ඩොලර් අතර exchange rate ගණනය කිරීම් අභ්‍යන්තරව සඟවා `convert()` method එක පමණක් ලබා දෙයි.
3. **Layered Abstraction**:
   - Controller Layer: HTTP requests සහ JSON serialization සඟවයි.
   - Service Layer: Business logic සහ transaction management සඟවයි.
   - Repository Layer: Database SQL queries සහ connections සඟවයි.

---

### 3.5 Object Relationships (වස්තු අතර සබඳතා)

Objects එකිනෙක සම්බන්ධ වන ආකාරය අනුව ප්‍රධාන කොටස් 3කට බෙදේ:

#### 1. Composition (දැඩි සබඳතාවය - "Part-of")
Child object එකට Parent නැතිව පැවතිය නොහැක. Parent මැකුණහොත් Child ද ස්වයංක්‍රීයව මැකී යයි (`cascade = CascadeType.ALL, orphanRemoval = true`).

- `Order` $\rightarrow$ `SellerOrder`: පාරිභෝගිකයාගේ Order එකක් නැතිව Seller sub-order එකක් පැවතිය නොහැක.
- `SellerOrder` $\rightarrow$ `OrderItem`: Sub-order එක නැතිව මිලදී ගත් භාණ්ඩ ලැයිස්තුවට පැවැත්මක් නැත.
- `Order` $\rightarrow$ `OrderStatusHistory`: Order එක මැකුණොත් ඊට අදාළ status audit logs ද මැකේ.
- `ShoppingCart` $\rightarrow$ `CartItem`: Cart එක හිස් කළ විට cart items මැකී යයි.
- `Buyer` $\rightarrow$ `ShoppingCart`: Buyer ගිණුම මැකූ විට cart එකද මැකී යයි.

#### 2. Aggregation (ලිහිල් සබඳතාවය - "Has-a")
Child objects වලට Parent ගෙන් ස්වාධීනව පැවතිය හැක:
- `Seller` $\rightarrow$ `Product`: Seller කෙනෙකු තාවකාලිකව suspend හෝ ඉවත් කළද, කලින් ඇණවුම් වල historical integrity තබා ගැනීමට `Product` records database එකේ ඉතිරි වේ.
- `Product` $\rightarrow$ `Review`: භාණ්ඩයකට පාරිභෝගික reviews එකතු වේ.
- `Buyer` $\rightarrow$ `Review`: ගැණුම්කරු ලියූ reviews.

#### 3. Association (පරිශීලන සබඳතාවය - "Uses-a")
එකිනෙකට වෙනස් domain objects අතර ඇති සබඳතා:
- `Order` $\rightarrow$ `Buyer` (Order එකක් අයිති Buyer කෙනෙකුටය).
- `Order` $\rightarrow$ `Payment` (Order එකක් ගෙවීම් වාර්තාවක් සමග සම්බන්ධ වේ).
- `SellerOrder` $\rightarrow$ `Seller` (වෙන් කළ sub-order එකක් අදාළ vendor වෙත යොමු කෙරේ).

---

## 4. OOP Design Patterns

Serendip backend හි භාවිත වන ප්‍රධාන Design Patterns:

1. **Strategy Pattern** ([PaymentMethod.java](file:///c:/Users/lahir/OneDrive/Desktop/Serendip/src/main/java/com/serendip/marketplace/payment/PaymentMethod.java)):
   - Payment algorithms එකිනෙකට මාරු කළ හැකි (interchangeable) strategies ලෙස සකසා ඇත.
   - Open/Closed Principle: නව ගෙවීම් ක්‍රමයක් (උදා: Crypto හෝ Apple Pay) එක් කිරීමට පවතින checkout code වෙනස් කිරීමට අවශ්‍ය නැත; නව class එකක් `implements PaymentMethod` කිරීම පමණක් ප්‍රමාණවත්ය.
2. **Factory Method Pattern** ([PaymentMethodFactory.java](file:///c:/Users/lahir/OneDrive/Desktop/Serendip/src/main/java/com/serendip/marketplace/payment/PaymentMethodFactory.java)):
   - Request එකේ එන `paymentMethodName` ("CARD", "PAYPAL", "BANK") අනුව අදාළ strategy object එක සාදා දීම encapsulate කර ඇත.
   - Factory class එකේ constructor එක `private` කර static method එකක් මගින් object creation පාලනය කරයි.
3. **Dependency Injection / Inversion of Control (IoC)**:
   - Services සහ Controllers කිසිවිටෙක `new OrderRepository()` ලෙස objects සාදන්නේ නැත.
   - Constructor Injection මගින් Spring Framework එක විසින් dependencies inject කරනු ලබයි (Dependency Inversion Principle).

---

## 5. Multi-Vendor Checkout & Financial Logic

බහු-වෙළෙන්දන්ගේ භාණ්ඩ එකවර මිලදී ගැනීමේදී මුදල් ගණනය වන ආකාරය:

1. **Stock Reservation**: පාරිභෝගිකයා checkout කළ සැනින් `Product.deductStock()` මගින් තොග අඩු වේ.
2. **Order Splitting**: Cart එකේ ඇති භාණ්ඩ sellers ලා අනුව වෙන් කර එක් එක් seller සඳහා `SellerOrder` සෑදේ.
3. **Financial Formulas**:
   $$\text{Line Total} = \text{unitPriceAtPurchase} \times \text{quantity}$$
   $$\text{Seller Subtotal} = \sum \text{Line Totals}$$
   $$\text{Commission Amount} = \text{Subtotal} \times \left(\frac{\text{commissionRate}}{100}\right)$$
   $$\text{Net Payout to Seller} = \text{Subtotal} - \text{Commission Amount}$$
4. **Order State Lifecycle**:
   `PENDING_PAYMENT` $\rightarrow$ `PAYMENT_CONFIRMED` $\rightarrow$ `PROCESSING` $\rightarrow$ `SHIPPED` $\rightarrow$ `DELIVERED`
   *(Order එක cancel කළහොත් `Product.replenishStock()` මගින් තොග නැවත catalog එකට එකතු වේ).*

---

## 6. Security & Role-Based Access Control (RBAC)

Spring Security මගින් roles 3ක් යටතේ අවසර ලබා දී ඇත:
- **`ROLE_BUYER`**: Cart පරිහරණය, Checkout කිරීම, Review ලිවීම.
- **`ROLE_SELLER`**: භාණ්ඩ ඇතුළත් කිරීම, මිල සහ තොග වෙනස් කිරීම, තමන්ගේ orders fulfill කිරීම.
- **`ROLE_ADMIN`**: Users ලා activate/suspend කිරීම, Seller කොමිස් ප්‍රතිශත වෙනස් කිරීම, Platform analytics බැලීම, Orders CSV export කිරීම.

---

## 7. REST API Endpoints සාරාංශය

| Module | HTTP Method & Path | Access Role | කාර්යය (Purpose) |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST /api/v1/auth/login` | Public | පරිශීලක login වීම සහ token/session ලබා ගැනීම |
| **Auth** | `POST /api/v1/users/buyers` | Public | නව Buyer ගිණුමක් ලියාපදිංචි කිරීම |
| **Auth** | `POST /api/v1/users/sellers` | Public | නව Seller ගිණුමක් ලියාපදිංචි කිරීම |
| **Products**| `GET /api/v1/products` | Public | භාණ්ඩ catalog එක සෙවීම සහ නැරඹීම |
| **Products**| `POST /api/v1/products` | `SELLER` | නව භාණ්ඩයක් ඇතුළත් කිරීම (USD වලින්) |
| **Products**| `POST /api/v1/products/lkr` | `SELLER` | LKR වලින් භාණ්ඩ ඇතුළත් කිරීම (Auto-convert to USD) |
| **Products**| `POST /api/v1/products/{id}/image`| `SELLER` | Multipart image upload කර Base64 ලෙස DB එකේ තැන්පත් කිරීම |
| **Cart** | `GET /api/v1/carts/{buyerId}` | `BUYER` | පාරිභෝගිකයාගේ cart එක බැලීම |
| **Cart** | `POST /api/v1/carts/{buyerId}/items`| `BUYER` | Cart එකට භාණ්ඩ එකතු කිරීම |
| **Orders** | `POST /api/v1/orders/checkout` | `BUYER` | Multi-vendor checkout සහ payment සිදු කිරීම |
| **Orders** | `GET /api/v1/orders/seller/{id}`| `SELLER` | Seller හට තමන්ගේ sub-orders බැලීම |
| **Orders** | `PUT /api/v1/orders/seller-orders/{id}/status` | `SELLER` | Tracking number දමා භාණ්ඩය SHIPPED කිරීම |
| **Admin** | `GET /api/v1/orders/admin` | `ADMIN` | සියලු orders බැලීම සහ සෙවීම |
| **Admin** | `GET /api/v1/orders/admin/export-csv` | `ADMIN` | Orders දත්ත CSV ගොනුවක් ලෙස download කිරීම |
| **Reviews** | `POST /api/v1/reviews` | `BUYER` | මිලදී ගත් භාණ්ඩ සඳහා තරු 1-5 rating සහ review දැමීම |

---

> **සටහන**: සම්පූර්ණ ඉංග්‍රීසි තාක්ෂණික ලියකියවිලි සඳහා [BACKEND_NOTE.md](file:///c:/Users/lahir/OneDrive/Desktop/Serendip/BACKEND_NOTE.md) සහ [OOP_CONCEPTS_DOCUMENTATION.md](file:///c:/Users/lahir/OneDrive/Desktop/Serendip/OOP_CONCEPTS_DOCUMENTATION.md) ගොනු බලන්න.
