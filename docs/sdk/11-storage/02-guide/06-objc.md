---
id: objc
title: 数据存储开发指南 · Objective-C
sidebar_label: Objective-C 指南
---



数据存储是云服务提供的核心功能之一，可用于存放和查询应用数据。下面的代码展示了如何创建一个对象并将其存入云端：

```objc
// 构建对象
LCObject *todo = [LCObject objectWithClassName:@"Todo"];

// 为属性赋值
[todo setObject:@"工程师周会"        forKey:@"title"];
[todo setObject:@"周二两点，全体成员" forKey:@"content"];

// 将对象保存到云端
[todo saveInBackgroundWithBlock:^(BOOL succeeded, NSError *error) {
    if (succeeded) {
        // 成功保存之后，执行其他逻辑
        NSLog(@"保存成功。objectId：%@", todo.objectId);
    } else {
        // 异常处理
    }
}];
```

我们为各个平台或者语言开发的 SDK 在底层都是通过 HTTPS 协议调用统一的 REST API，提供完整的接口对数据进行各类操作。

## SDK 安装与初始化

请阅读[数据存储、即时通讯 Objective C SDK 配置指南](/sdk/storage/guide/setup-objc/)。

## 对象

### `LCObject`

`LCObject` 是云服务对复杂对象的封装，每个 `LCObject` 包含若干与 JSON 格式兼容的属性值对（也称键值对，key-value pairs）。这个数据是无模式化的（schema free），意味着你不需要提前标注每个 `LCObject` 上有哪些 key，你只需要随意设置键值对就可以，云端会保存它。

比如说，一个保存着单个 Todo 的 `LCObject` 可能包含如下数据：

```json
title:      "给小林发邮件确认会议时间",
isComplete: false,
priority:   2,
tags:       ["工作", "销售"]
```


### 数据类型

`LCObject` 支持的数据类型包括 `String`、`Number`、`Boolean`、`Object`、`Array`、`Date` 等等。你可以通过嵌套的方式在 `Object` 或 `Array` 里面存储更加结构化的数据。

`LCObject` 还支持两种特殊的数据类型 `Pointer` 和 `File`，可以分别用来存储指向其他 `LCObject` 的指针以及二进制数据。

`LCObject` 同时支持 `GeoPoint`，可以用来存储地理位置信息。参见 [GeoPoint](#geopoint)。

以下是一些示例：

```objc
// 基本类型
NSNumber     *boolean    = @(YES);
NSNumber     *number     = [NSNumber numberWithInt:2018];
NSString     *string     = [NSString stringWithFormat:@"%@ 流行音乐榜单", number];
NSDate       *date       = [NSDate date];
NSData       *data       = [@"Hello world!" dataUsingEncoding:NSUTF8StringEncoding];
NSArray      *array      = [NSArray arrayWithObjects: string, number, nil];
NSDictionary *dictionary = [NSDictionary dictionaryWithObjectsAndKeys: number, @"number", string, @"string", nil];

// 构建对象
LCObject *testObject = [LCObject objectWithClassName:@"TestObject"];
[testObject setObject:boolean    forKey:@"testBoolean"];
[testObject setObject:number     forKey:@"testInteger"];
[testObject setObject:string     forKey:@"testString"];
[testObject setObject:date       forKey:@"testDate"];
[testObject setObject:data       forKey:@"testData"];
[testObject setObject:array      forKey:@"testArray"];
[testObject setObject:dictionary forKey:@"testDictionary"];
[testObject saveInBackground];
```

我们不推荐通过 `NSData` 在 `LCObject` 里面存储图片、文档等大型二进制数据。每个 `LCObject` 的大小不应超过 **128 KB**。如需存储大型文件，可创建 `LCFile` 实例并将将其关联到 `LCObject` 的某个属性上。参见 [文件](#文件)。

注意：时间类型在云端将会以 UTC 时间格式存储，但是客户端在读取之后会转化成本地时间。

**云服务控制台 > 数据存储 > 结构化数据** 中展示的日期数据也会依据操作系统的时区进行转换。一个例外是当你通过 REST API 获得数据时，这些数据将以 UTC 呈现。你可以手动对它们进行转换。

若想了解云服务是如何保护应用数据的，请阅读[数据和安全](/sdk/storage/guide/security/)。

### 构建对象

下面的代码构建了一个 class 为 `Todo` 的 `LCObject`：

```objc
LCObject *todo = [LCObject objectWithClassName:@"Todo"];

// 等同于
LCObject *todo = [[LCObject alloc] initWithClassName:@"Todo"];
```


在构建对象时，为了使云端知道对象属于哪个 class，需要将 class 的名字作为参数传入。你可以将云服务里面的 class 比作关系型数据库里面的表。一个 class 的名字必须以字母开头，且只能包含数字、字母和下划线。

### 保存对象

下面的代码将一个 class 为 `Todo` 的对象存入云端：

```objc
// 构建对象
LCObject *todo = [LCObject objectWithClassName:@"Todo"];

// 为属性赋值
[todo setObject:@"马拉松报名" forKey:@"title"];
[todo setObject:@2 forKey:@"priority"];

// 将对象保存到云端
[todo saveInBackgroundWithBlock:^(BOOL succeeded, NSError *error) {
    if (succeeded) {
        // 成功保存之后，执行其他逻辑
        NSLog(@"保存成功。objectId：%@", todo.objectId);
    } else {
        // 异常处理
    }
}];
```

为了确认对象已经保存成功，我们可以到 **云服务控制台 > 数据存储 > 结构化数据 > `Todo`** 里面看一下，应该会有一行新的数据产生。点一下这个数据的 `objectId`，应该能看到类似这样的内容：

```json
{
  "title":     "马拉松报名",
  "priority":  2,
  "ACL": {
    "*": {
      "read":  true,
      "write": true
    }
  },
  "objectId":  "582570f38ac247004f39c24b",
  "createdAt": "2017-11-11T07:19:15.549Z",
  "updatedAt": "2017-11-11T07:19:15.549Z"
}
```

注意，无需在 **云服务控制台 > 数据存储 > 结构化数据** 里面创建新的 `Todo` class 即可运行前面的代码。如果 class 不存在，它将自动创建。

以下是一些对象的内置属性，会在对象保存时自动创建，无需手动指定：

内置属性 | 类型 | 描述
--- | --- | ---
`objectId` | `NSString` | 该对象唯一的 ID 标识。
`ACL` | `LCACL` | 该对象的权限控制，实际上是一个 JSON 对象，控制台做了展现优化。
`createdAt` | `NSDate` | 该对象被创建的时间。
`updatedAt` | `NSDate` | 该对象最后一次被修改的时间。


这些属性的值会在对象被存入云端时自动填入，代码中尚未保存的 `LCObject` 不存在这些属性。

属性名（**keys**）只能包含字母、数字和下划线。自定义属性不得以双下划线（`__`）开头或与任何系统保留字段和内置属性（`ACL`、`className`、`createdAt`、`objectId` 和 `updatedAt`）重名，无论大小写。

属性值（**values**）可以是字符串、数字、布尔值、数组或字典（任何能以 JSON 编码的数据）。参见 [数据类型](#数据类型)。

我们推荐使用驼峰式命名法（CamelCase）为类和属性来取名。类，采用大驼峰法，如 `CustomData`。属性，采用小驼峰法，如 `imageUrl`。

### 获取对象

对于已经保存到云端的 `LCObject`，可以通过它的 `objectId` 将其取回：

```objc
LCQuery *query = [LCQuery queryWithClassName:@"Todo"];
[query getObjectInBackgroundWithId:@"582570f38ac247004f39c24b" block:^(LCObject *todo, NSError *error) {
    // todo 就是 objectId 为 582570f38ac247004f39c24b 的 Todo 实例
    NSString *title    = todo[@"title"];
    int priority       = [[todo objectForKey:@"priority"] intValue];

    // 获取内置属性
    NSString *objectId = todo.objectId;
    NSDate *updatedAt  = todo.updatedAt;
    NSDate *createdAt  = todo.createdAt;
}];
```


对象拿到之后，可以通过 `get` 方法来获取各个属性的值。注意 `objectId`、`updatedAt` 和 `createdAt` 这三个内置属性不能通过 `get` 获取或通过 `set` 修改，只能由云端自动进行填充。尚未保存的 `LCObject` 不存在这些属性。

如果你试图获取一个不存在的属性，SDK 不会报错，而是会返回 `nil`。

#### 同步对象

当云端数据发生更改时，你可以调用 `fetchInBackgroundWithBlock` 方法来刷新对象，使之与云端数据同步：

```objc
LCObject *todo = [LCObject objectWithClassName:@"Todo" objectId:@"582570f38ac247004f39c24b"];
[todo fetchInBackgroundWithBlock:^(LCObject *todo, NSError *error) {
    // todo 已刷新
}];
```


刷新操作会强行使用云端的属性值覆盖本地的属性。因此如果本地有属性修改，**`fetchInBackgroundWithBlock` 操作会丢弃这些修改**。为避免这种情况，你可以在刷新时指定 **需要刷新的属性**，这样只有指定的属性会被刷新（包括内置属性 `objectId`、`createdAt` 和 `updatedAt`），其他属性不受影响。

```objc
LCObject *todo = [LCObject objectWithClassName:@"Todo" objectId:@"582570f38ac247004f39c24b"];
NSArray *keys = [NSArray arrayWithObjects:@"priority", @"location", nil];
[todo fetchInBackgroundWithKeys:keys block:^(LCObject *todo, NSError *error) {
    // 只有 priority 和 location 会被获取和刷新
}];
```

### 更新对象

要更新一个对象，只需指定需要更新的属性名和属性值，然后调用 `saveInBackground` 方法。例如：

要更新一个对象，只需指定需要更新的属性名和属性值，然后调用 `saveInBackground` 方法。例如：

```objc
LCObject *todo = [LCObject objectWithClassName:@"Todo" objectId:@"582570f38ac247004f39c24b"];
[todo setObject:@"这周周会改到周三下午三点。" forKey:@"content"];
[todo saveInBackground];
```

云服务会自动识别需要更新的属性并将对应的数据发往云端，未更新的属性会保持原样。

#### 有条件更新对象

通过传入 `query` 选项，可以按照指定条件去更新对象——当条件满足时，执行更新；条件不满足时，不执行更新并返回 `305` 错误。

例如，用户的账户表 `Account` 有一个余额字段 `balance`，同时有多个请求要修改该字段值。为避免余额出现负值，只有当金额小于或等于余额的时候才能接受请求：

```objc
LCObject *account = [LCObject objectWithClassName:@"Account" objectId:@"5745557f71cfe40068c6abe0"];
// 对 balance 原子减少 100
NSInteger amount = -100;
[account incrementKey:@"balance" byAmount:@(amount)];
// 设置条件
LCQuery *query = [[LCQuery alloc] init];
[query whereKey:@"balance" greaterThanOrEqualTo:@(-amount)];
LCSaveOption *option = [[LCSaveOption alloc] init];
option.query = query;
// 操作结束后，返回最新数据。
// 如果是新对象，则所有属性都会被返回，
// 否则只有更新的属性会被返回。
option.fetchWhenSave = YES;
[account saveInBackgroundWithOption:option block:^(BOOL succeeded, NSError * _Nullable error) {
    if (succeeded) {
        NSLog(@"当前余额为：%@", account[@"balance"]);
    } else if (error.code == 305) {
        NSLog(@"余额不足，操作失败！");
    }
}];
```


**`query` 选项只对已存在的对象有效**，不适用于尚未存入云端的对象。

`query` 选项在有多个客户端需要更新同一属性的时候非常有用。相比于通过 `LCQuery` 查询 `LCObject` 再对其进行更新的方法，这样做更加简洁，并且能够避免出现差错。

#### 更新计数器

设想我们正在开发一个微博，需要统计一条微博有多少个赞和多少次转发。由于赞和转发的操作可能由多个客户端同时进行，直接在本地更新数字并保存到云端的做法极有可能导致差错。为保证计数的准确性，可以通过 **原子操作** 来增加或减少一个属性内保存的数字：

```objc
[post incrementKey:@"likes" byAmount:@1];
```


可以指定需要增加或减少的值。若未指定，则默认使用 `1`。

注意，虽然原子增减支持浮点数，但因为底层数据库的浮点数存储格式限制，会有舍入误差。
因此，需要原子增减的字段建议使用整数以避免误差，例如 `3.14` 可以存储为 `314`，然后在客户端进行相应的转换。
否则，以比较大小为条件查询对象的时候，需要特殊处理，
`< a` 需改查 `< a + e`，`> a` 需改查 `> a - e`，`== a` 需改查 `> a - e` 且 `< a + e`，其中 `e` 为误差范围，据所需精度取值，比如 `0.0001`。

#### 更新数组

更新数组也是原子操作。使用以下方法可以方便地维护数组类型的数据：

- `addObject:forKey:` 将指定对象附加到数组末尾。
- `addObjectsFromArray:forKey:` 将指定对象数组附加到数组末尾。
- `addUniqueObject:forKey:` 将指定对象附加到数组末尾，确保对象唯一。
- `addUniqueObjectsFromArray:forKey:` 将指定对象数组附加到数组末尾，确保对象唯一。
- `removeObject:forKey:` 从数组字段中删除指定对象的所有实例。
- `removeObjectsInArray:forKey:` 从数组字段中删除指定的对象数组。


例如，`Todo` 用一个 `alarms` 属性保存所有闹钟的时间。下面的代码将多个时间加入这个属性：

```objc
-(NSDate*) getDateWithDateString:(NSString*) dateString{
    NSDateFormatter *dateFormat = [[NSDateFormatter alloc] init];
    [dateFormat setDateFormat:@"yyyy-MM-dd HH:mm:ss"];
    NSDate *date = [dateFormat dateFromString:dateString];
    return date;
}

NSDate *alarm1 = [self getDateWithDateString:@"2018-04-30 07:10:00"];
NSDate *alarm2 = [self getDateWithDateString:@"2018-04-30 07:20:00"];
NSDate *alarm3 = [self getDateWithDateString:@"2018-04-30 07:30:00"];

NSArray *alarms = [NSArray arrayWithObjects:alarm1, alarm2, alarm3, nil];

LCObject *todo = [LCObject objectWithClassName:@"Todo"];
[todo addUniqueObjectsFromArray:alarms forKey:@"alarms"];
[todo saveInBackground];
```

### 删除对象

下面的代码从云端删除一个 `Todo` 对象；

```objc
LCObject *todo = [LCObject objectWithClassName:@"Todo" objectId:@"582570f38ac247004f39c24b"];
[todo deleteInBackground];
```

注意，删除对象是一个较为敏感的操作，我们建议你阅读[《ACL 权限管理开发指南》](https://leancloud.cn/docs/acl-guide.html)来了解潜在的风险。熟悉 class 级别、对象级别和字段级别的权限可以帮助你有效阻止未经授权的操作。

### 批量操作

```objc
// 批量构建和更新
+ (BOOL)saveAll:(NSArray *)objects error:(NSError **)error;
+ (void)saveAllInBackground:(NSArray *)objects
                      block:(LCBooleanResultBlock)block;

// 批量删除
+ (BOOL)deleteAll:(NSArray *)objects error:(NSError **)error;
+ (void)deleteAllInBackground:(NSArray *)objects
                        block:(LCBooleanResultBlock)block;

// 批量同步
+ (BOOL)fetchAll:(NSArray *)objects error:(NSError **)error;
+ (void)fetchAllInBackground:(NSArray *)objects
                       block:(LCArrayResultBlock)block;
```

下面的代码将所有 `Todo` 的 `isComplete` 设为 `true`：

```objc
LCQuery *query = [LCQuery queryWithClassName:@"Todo"];
[query findObjectsInBackgroundWithBlock:^(NSArray *todos, NSError *error) {
    // 获取需要更新的 todo
    for (LCObject *todo in todos) {
        // 更新属性值
        todo[@"isComplete"] = @(YES);
    }
    // 批量更新
    [LCObject saveAllInBackground:todos];
}];
```


虽然上述方法可以在一次请求中包含多个操作，每一个分别的保存或同步操作在计费时依然会被算作一次请求，而所有的删除操作则会被合并为一次请求。
### 后台运行

细心的开发者已经发现，在所有的示例代码中几乎都是用了异步来访问云端，形如 `xxxxInBackground` 的用法都是提供给开发者在主线程调用用以实现后台运行的方法，因此开发者在主线程可以放心地调用这种命名方式的函数。

### 离线存储对象

大多数保存功能可以立刻执行，并通知应用「保存完毕」。不过若不需要知道保存完成的时间，则可使用 `saveEventually` 来代替。

它的优点在于：如果用户目前尚未接入网络，`saveEventually` 会缓存设备中的数据，并在网络连接恢复后上传。如果应用在网络恢复之前就被关闭了，那么当它下一次打开时，SDK 会再次尝试保存操作。

所有 `saveEventually`（或 `deleteEventually`）的相关调用，将按照调用的顺序依次执行。因此，多次对某一对象使用 `saveEventually` 是安全的。

### 数据模型

对象之间可以产生关联。拿一个博客应用来说，一个 `Post` 对象可以与许多个 `Comment` 对象产生关联。云服务支持三种关系：一对一、一对多、多对多。

#### 一对一、一对多关系

一对一、一对多关系可以通过将 `LCObject` 保存为另一个对象的属性值的方式产生。比如说，让博客应用中的一个 `Comment` 指向一个 `Post`。

下面的代码会创建一个含有单个 `Comment` 的 `Post`：

```objc
// 创建 post
LCObject *post = [[LCObject alloc] initWithClassName:@"Post"];
[post setObject:@"饿了……" forKey:@"title"];
[post setObject:@"中午去哪吃呢？" forKey:@"content"];

// 创建 comment
LCObject *comment = [[LCObject alloc] initWithClassName:@"Comment"];
[comment setObject:@"当然是肯德基啦！" forKey:@"content"];

// 将 post 设为 comment 的一个属性值
[comment setObject:post forKey:@"parent"];

// 保存 comment 会同时保存 post
[comment saveInBackground];
```

云端存储时，会将被指向的对象用 `Pointer` 的形式存起来。你也可以用 `objectId` 来指向一个对象：

```objc
LCObject *post = [LCObject objectWithClassName:@"Post" objectId:@"57328ca079bc44005c2472d0"];
[comment setObject:post forKey:@"post"];
```


请参阅 [关系查询](#关系查询) 来了解如何获取关联的对象。

#### 多对多关系

想要建立多对多关系，最简单的办法就是使用 **数组**。在大多数情况下，使用数组可以有效减少查询的次数，提升程序的运行效率。但如果有额外的属性需要附着于两个 class 之间的关联，那么使用 **中间表** 可能是更好的方式。注意这里说到的额外的属性是用来描述 class 之间的关系的，而不是任何单一的 class 的。

我们建议你在任何一个 class 的对象数量超出 100 的时候考虑使用中间表。

### 序列化和反序列化

在实际的开发中，把 `LCObject` 当作参数传递的时候，会涉及到复杂对象的拷贝的问题，因此 `LCObject` 也提供了序列化和反序列化的方法。

序列化：

```objc
LCObject *todo = [[LCObject alloc] initWithClassName:@"Todo"]; // 构建对象
[todo setObject:@"马拉松报名" forKey:@"title"]; // 设置名称
[todo setObject:@2 forKey:@"priority"]; // 设置优先级
[todo setObject:[LCUser currentUser] forKey:@"owner"]; // 这里就是一个 Pointer 类型，指向当前登录的用户

NSMutableDictionary *serializedJSONDictionary = [todo dictionaryForObject]; // 获取序列化后的字典
NSError *err;
NSData *jsonData = [NSJSONSerialization dataWithJSONObject:serializedJSONDictionary options:0 error:&err]; // 获取 JSON 数据
NSString *serializedString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding]; // 获取 JSON 字符串
// serializedString 的内容是：{"title":"马拉松报名","className":"Todo","priority":2}
```


反序列化：

```objc
NSMutableDictionary *objectDictionary = [NSMutableDictionary dictionaryWithCapacity:10];// 声明一个 NSMutableDictionary
[objectDictionary setObject:@"马拉松报名" forKey:@"title"];
[objectDictionary setObject:@2 forKey:@"priority"];
[objectDictionary setObject:@"Todo" forKey:@"className"];

LCObject *todo = [LCObject objectWithDictionary:objectDictionary]; // 由 NSMutableDictionary 转化一个 LCObject

[todo saveInBackground]; // 保存到云端
```

## 查询

我们已经了解到如何从云端获取单个 `LCObject`，但你可能还会有一次性获取多个符合特定条件的 `LCObject` 的需求，这时候就需要用到 `LCQuery` 了。

### 基础查询

执行一次基础查询通常包括这些步骤：

1. 构建 `LCQuery`；
2. 向其添加查询条件；
3. 执行查询并获取包含满足条件的对象的数组。

下面的代码获取所有 `lastName` 为 `Smith` 的 `Student`：

```objc
LCQuery *query = [LCQuery queryWithClassName:@"Student"];
[query whereKey:@"lastName" equalTo:@"Smith"];
[query findObjectsInBackgroundWithBlock:^(NSArray *students, NSError *error) {
    // students 是包含满足条件的 Student 对象的数组
}];
```

### 查询条件

可以给 `LCObject` 添加不同的条件来改变获取到的结果。

下面的代码查询所有 `firstName` 不为 `Jack` 的对象：

```objc
[query whereKey:@"firstName" notEqualTo:@"Jack"];
```

对于能够排序的属性（比如数字、字符串），可以进行比较查询：

```objc
// 限制 age < 18
[query whereKey:@"age" lessThan:@18];

// 限制 age <= 18
[query whereKey:@"age" lessThanOrEqualTo:@18];

// 限制 age > 18
[query whereKey:@"age" greaterThan:@18];

// 限制 age >= 18
[query whereKey:@"age" greaterThanOrEqualTo:@18];
```

可以在同一个查询中设置多个条件，这样可以获取满足所有条件的结果。可以理解为所有的条件是 `AND` 的关系：

```objc
[query whereKey:@"firstName" equalTo:@"Jack"];
[query whereKey:@"age" greaterThan:@18];
```

可以通过指定 `limit` 限制返回结果的数量（默认为 `100`）：

```objc
// 最多获取 10 条结果
query.limit = 10;
```

由于性能原因，`limit` 最大只能设为 `1000`。即使将其设为大于 `1000` 的数，云端也只会返回 1,000 条结果。

如果只需要一条结果，可以直接用 `getFirstObject`：

```objc
LCQuery *query = [LCQuery queryWithClassName:@"Todo"];
[query whereKey:@"priority" equalTo:@2];
[query getFirstObjectInBackgroundWithBlock:^(LCObject *todo, NSError *error) {
    // todo 是第一个满足条件的 Todo 对象
}];
```

可以通过设置 `skip` 来跳过一定数量的结果：

```objc
// 跳过前 20 条结果
query.skip = 20;
```

把 `skip` 和 `limit` 结合起来，就能实现翻页功能：

```objc
LCQuery *query = [LCQuery queryWithClassName:@"Todo"];
[query whereKey:@"priority" equalTo:@2];
query.limit = 10;
query.skip = 20;
```

需要注意的是，`skip` 的值越高，查询所需的时间就越长。作为替代方案，可以通过设置 `createdAt` 或 `updatedAt` 的范围来实现更高效的翻页，因为它们都自带索引。
同理，也可以通过设置自增字段的范围来实现翻页。

对于能够排序的属性，可以指定结果的排序规则：

```objc
// 按 createdAt 升序排列
[query orderByAscending:@"createdAt"];

// 按 createdAt 降序排列
[query orderByDescending:@"createdAt"];
```

还可以为同一个查询添加多个排序规则；

```objc
[query addAscendingOrder:@"priority"];
[query addDescendingOrder:@"createdAt"];
```

下面的代码可用于查找包含或不包含某一属性的对象：


可以通过 `selectKeys` 指定需要返回的属性。下面的代码只获取每个对象的 `title` 和 `content`（包括内置属性 `objectId`、`createdAt` 和 `updatedAt`）：

```objc
LCQuery *query = [LCQuery queryWithClassName:@"Todo"];
[query selectKeys:@[@"title", @"content"]];
[query getFirstObjectInBackgroundWithBlock:^(LCObject *todo, NSError *error) {
    NSString *title = todo[@"title"]; // √
    NSString *content = todo[@"content"]; // √
    NSString *notes = todo[@"notes"]; // 会报错
}];
```

`selectKeys`
支持点号（`author.firstName`），详见[《点号使用指南》](https://leancloud.cn/docs/dot-notation.html)。
另外，字段名前添加减号前缀表示反向选择，例如 `-author` 表示不返回 `author` 字段。
反向选择同样适用于内置字段，比如 `-objectId`，也可以和点号组合使用，比如 `-pubUser.createdAt`。

对于未获取的属性，可以通过对结果中的对象进行 `fetchInBackgroundWithBlock` 操作来获取。参见 [同步对象](#同步对象)。
### 字符串查询

可以用 `hasPrefix` 来查找某一属性值以特定字符串开头的对象。和 SQL 中的 `LIKE` 一样，你可以利用索引带来的优势：

```objc
LCQuery *query = [LCQuery queryWithClassName:@"Todo"];
// 相当于 SQL 中的 title LIKE 'lunch%'
[query whereKey:@"title" hasPrefix:@"lunch"];
```


可以用 `containsString` 来查找某一属性值包含特定字符串的对象：

```objc
LCQuery *query = [LCQuery queryWithClassName:@"Todo"];
// 相当于 SQL 中的 title LIKE '%lunch%'
[query whereKey:@"title" containsString:@"lunch"];
```


和 `hasPrefix` 不同，`containsString` 无法利用索引，因此不建议用于大型数据集。

注意 `hasPrefix` 和 `containsString` 都是 **区分大小写** 的，所以上述查询会忽略 `Lunch`、`LUNCH` 等字符串。

如果想查找某一属性值不包含特定字符串的对象，可以使用 `matchesRegex` 进行基于正则表达式的查询：

```objc
LCQuery *query = [LCQuery queryWithClassName:@"Todo"];
// "title" 不包含 "ticket"（不区分大小写）
[query whereKey:@"title" matchesRegex:@"^((?!ticket).)*$", modifiers:"i"];
```

不过我们并不推荐大量使用这类查询，尤其是对于包含超过 100,000 个对象的 class，
因为这类查询无法利用索引，实际操作中云端会遍历所有对象来获取结果。如果有进行全文搜索的需求，可以使用全文搜索服务。

使用查询时如果遇到性能问题，可参阅 [查询性能优化](#查询性能优化)。

### 数组查询

下面的代码查找所有数组属性 `tags` 包含 ` 工作 ` 的对象：

```objc
[query whereKey:@"tags" equalTo:@"工作"];
```

下面的代码查询数组属性长度为 3 （正好包含 3 个标签）的对象：

```objc
[query whereKey:@"tags" sizeEqualTo:3];
```

下面的代码查找所有数组属性 `tags` **同时包含** `工作`、`销售` 和 `会议` 的对象：

```objc
[query whereKey:@"tags" containsAllObjectsInArray:[NSArray arrayWithObjects:@"工作", @"销售", @"会议", nil]];
```

如需获取某一属性值包含一列值中任意一个值的对象，可以直接用 `containedIn` 而无需执行多次查询。下面的代码构建的查询会查找所有 `priority` 为 `1` **或** `2` 的 todo 对象：

```objc
// 单个查询
LCQuery *priorityOneOrTwo = [LCQuery queryWithClassName:@"Todo"];
[priorityOneOrTwo whereKey:@"priority" containedIn:[NSArray arrayWithObjects:@1, @2, nil]];
// 这样就可以了 :)

// ---------------
//       vs.
// ---------------

// 多个查询
LCQuery *priorityOne = [LCQuery queryWithClassName:@"Todo"];
[priorityOne whereKey:@"priority" equalTo:@1];

LCQuery *priorityTwo = [LCQuery queryWithClassName:@"Todo"];
[priorityTwo whereKey:@"priority" equalTo:@2];

LCQuery *priorityOneOrTwo = [LCQuery orQueryWithSubqueries:[NSArray arrayWithObjects:priorityOne, priorityTwo, nil]];
// 好像有些繁琐 :(
```

反过来，还可以用 `notContainedIn` 来获取某一属性值不包含一列值中任何一个的对象。

### 关系查询

查询关联数据有很多种方式，常见的一种是查询某一属性值为特定 `LCObject` 的对象，这时可以像其他查询一样直接用 `equalTo`。比如说，如果每一条博客评论 `Comment` 都有一个 `post` 属性用来存放原文 `Post`，则可以用下面的方法获取所有与某一 `Post` 相关联的评论：

```objc
LCObject *post = [LCObject objectWithClassName:@"Post" objectId:@"57328ca079bc44005c2472d0"];
LCQuery *query = [LCQuery queryWithClassName:@"Comment"];
[query whereKey:@"post" equalTo:post];
[query findObjectsInBackgroundWithBlock:^(NSArray *comments, NSError *error) {
    // comments 包含与 post 相关联的评论
}];
```

如需获取某一属性值为另一查询结果中任一 `LCObject` 的对象，可以用 `matchesQuery`。下面的代码构建的查询可以找到所有包含图片的博客文章的评论：

```objc
LCQuery *innerQuery = [LCQuery queryWithClassName:@"Post"];
[innerQuery whereKeyExists:@"images"];

LCQuery *query = [LCQuery queryWithClassName:@"Comment"];
[query whereKey:@"post" matchesQuery:innerQuery];
```

如需获取某一属性值不是另一查询结果中任一 `LCObject` 的对象，则使用 `doesNotMatchQuery`。

有时候可能需要获取来自另一个 class 的数据而不想进行额外的查询，此时可以在同一个查询上使用 `includeKey`。下面的代码查找最新发布的 10 条评论，并包含各自对应的博客文章：

```objc
LCQuery *query = [LCQuery queryWithClassName:@"Comment"];

// 获取最新发布的
[query orderByDescending:@"createdAt"];

// 只获取 10 条
query.limit = 10;

// 同时包含博客文章
[query includeKey:@"post"];

[query findObjectsInBackgroundWithBlock:^(NSArray *comments, NSError *error) {
    // comments 包含最新发布的 10 条评论，包含各自对应的博客文章
    for (LCObject *comment in comments) {
        // 该操作无需网络连接
        LCObject *post = comment[@"post"];
    }
}];
```

可以用 dot 符号（`.`）来获取多级关系，例如 `post.author`，详见[《点号使用指南》](https://leancloud.cn/docs/dot-notation.html)的《在查询对象时使用点号》一节。

可以在同一查询上应用多次 `includeKey` 以包含多个属性。通过这种方法获取到的对象同样接受 `getFirstObject` 等 `LCQuery` 辅助方法。

通过 `includeKey` 进行多级查询的方式不适用于数组属性内部的 `LCObject`，只能包含到数组本身。

#### 关系查询的注意事项

云端使用的并非关系型数据库，无法做到真正的联表查询，所以实际的处理方式是：先执行内嵌／子查询（和普通查询一样，`limit` 默认为 `100`，最大 `1000`），然后将子查询的结果填入主查询的对应位置，再执行主查询。如果子查询匹配到的记录数量超出 `limit`，且主查询有其他查询条件，那么可能会出现没有结果或结果不全的情况，因为只有 `limit` 数量以内的结果会被填入主查询。

我们建议采用以下方案进行改进：

- 确保子查询的结果在 100 条以下，如果在 100 至 1,000 条之间的话请将子查询的 `limit` 设为 `1000`。
- 将需要查询的字段冗余到主查询所在的表上。
- 进行多次查询，每次在子查询上设置不同的 `skip` 值来遍历所有记录（注意 `skip` 的值较大时可能会引发性能问题，因此不是很推荐）。

### 统计总数量

如果只需知道有多少对象匹配查询条件而无需获取对象本身，可使用 `countObjectsInBackgroundWithBlock` 来代替 `findObjectsInBackgroundWithBlock`。比如说，查询有多少个已完成的 todo：

```objc
LCQuery *query = [LCQuery queryWithClassName:@"Todo"];
[query whereKey:@"isComplete" equalTo:@(YES)];
[query countObjectsInBackgroundWithBlock:^(NSInteger count, NSError *error) {
    NSLog(@"%ld 个 todo 已完成。", count);
}];
```

### 组合查询

组合查询就是把诸多查询条件用一定逻辑合并到一起（`OR` 或 `AND`）再交给云端去查询。

组合查询不支持在子查询中包含 `GeoPoint` 或其他非过滤性的限制（例如 `near`、`withinGeoBox`、`limit`、`skip`、`ascending`、`descending`、`include`）。

#### OR 查询

OR 操作表示多个查询条件符合其中任意一个即可。 例如，查询优先级大于等于 `3` 或者已经完成了的 todo：

```objc
LCQuery *priorityQuery = [LCQuery queryWithClassName:@"Todo"];
[priorityQuery whereKey:@"priority" greaterThanOrEqualTo:@3];

LCQuery *isCompleteQuery = [LCQuery queryWithClassName:@"Todo"];
[isCompleteQuery whereKey:@"isComplete" equalTo:@(YES)];

LCQuery *query = [LCQuery orQueryWithSubqueries:[NSArray arrayWithObjects:priorityQuery, isCompleteQuery, nil]];
```

使用 OR 查询时，子查询中不能包含 `GeoPoint` 相关的查询。

#### AND 查询

使用 AND 查询的效果等同于往 `LCQuery` 添加多个条件。下面的代码构建的查询会查找创建时间在 `2016-11-13` 和 `2016-12-02` 之间的 todo：

```objc
NSDate *(^dateFromString)(NSString *string) = ^(NSString *string) {
    NSDateFormatter *dateFormatter = [[NSDateFormatter alloc] init];
    [dateFormatter setDateFormat:@"yyyy-MM-dd"];
    return [dateFormatter dateFromString:string];
};

LCQuery *startDateQuery = [LCQuery queryWithClassName:@"Todo"];
[startDateQuery whereKey:@"createdAt" greaterThanOrEqualTo:dateFromString(@"2016-11-13")];

LCQuery *endDateQuery = [LCQuery queryWithClassName:@"Todo"];
[endDateQuery whereKey:@"createdAt" lessThan:dateFromString(@"2016-12-03")];

LCQuery *query = [LCQuery andQueryWithSubqueries:[NSArray arrayWithObjects:startDateQuery, endDateQuery, nil]];
```


单独使用 AND 查询跟使用基础查询相比并没有什么不同，不过当查询条件中包含不止一个 OR 查询时，就必须使用 AND 查询：


```objc
NSDate *(^dateFromString)(NSString *string) = ^(NSString *string) {
    NSDateFormatter *dateFormatter = [[NSDateFormatter alloc] init];
    [dateFormatter setDateFormat:@"yyyy-MM-dd"];
    return [dateFormatter dateFromString:string];
};

LCQuery *createdAtQuery = [LCQuery queryWithClassName:@"Todo"];
[createdAtQuery whereKey:@"createdAt" greaterThanOrEqualTo:dateFromString(@"2018-04-30")];
[createdAtQuery whereKey:@"createdAt" lessThan:dateFromString(@"2018-05-01")];

LCQuery *locationQuery = [LCQuery queryWithClassName:@"Todo"];
[locationQuery whereKeyDoesNotExist:@"location"];

LCQuery *priority2Query = [LCQuery queryWithClassName:@"Todo"];
[priority2Query whereKey:@"priority" equalTo:@2];

LCQuery *priority3Query = [LCQuery queryWithClassName:@"Todo"];
[priority3Query whereKey:@"priority" equalTo:@3];

LCQuery *priorityQuery = [LCQuery orQueryWithSubqueries:[NSArray arrayWithObjects:priority2Query, priority3Query, nil]];
LCQuery *timeLocationQuery = [LCQuery orQueryWithSubqueries:[NSArray arrayWithObjects:locationQuery, createdAtQuery, nil]];
LCQuery *query = [LCQuery andQueryWithSubqueries:[NSArray arrayWithObjects:priorityQuery, timeLocationQuery, nil]];
```

### 缓存查询

缓存一些查询的结果到磁盘上，这可以让你在离线的时候，或者应用刚启动，网络请求还没有足够时间完成的时候可以展现一些数据给用户。当缓存占用了太多空间的时候，LeanStorage 会自动清空缓存。

默认情况下的查询不会使用缓存，除非你调用接口明确设置启用。例如，尝试从网络请求，如果网络不可用则从缓存数据中获取，可以这样设置：

```objc
LCQuery *query = [LCQuery queryWithClassName:@"Post"];
query.cachePolicy = kLCCachePolicyNetworkElseCache;

// 设置缓存有效期
query.maxCacheAge = 24*3600;

[query findObjectsInBackgroundWithBlock:^(NSArray *objects, NSError *error) {
    if (!error) {
        // 成功找到结果，先找网络再访问磁盘
    } else {
        // 无法访问网络，本次查询结果未做缓存
    }
}];
```

#### 缓存策略

为了满足多变的需求，SDK 默认提供了以下几种缓存策略：

策略枚举 | 含义及解释
--- | ---
`kLCCachePolicyIgnoreCache`| **（默认缓存策略）**查询行为不从缓存加载，也不会将结果保存到缓存中。
`kLCCachePolicyCacheOnly` | 查询行为忽略网络状况，只从缓存加载。如果没有缓存结果，该策略会产生 `LCError`。
`kLCCachePolicyCacheElseNetwork` | 查询行为首先尝试从缓存加载，若加载失败，则通过网络加载结果。如果缓存和网络获取行为均为失败，则产生 `LCError`。注意查询条件默认会从当前时间从新往旧查询，因此这种情况下第一次查询总需要访问网络。
`kLCCachePolicyNetworkElseCache` | 查询行为先尝试从网络加载，若加载失败，则从缓存加载结果。如果缓存和网络获取行为均为失败，则产生 `LCError`。
`kLCCachePolicyCacheThenNetwork` | 查询先从缓存加载，然后从网络加载。在这种情况下，回调函数会被调用两次，第一次是缓存中的结果，然后是从网络获取的结果。因为它会在不同的时间返回两个结果，所以该策略不能与 `findObjects` 同时使用。

#### 缓存相关的操作

- 检查是否存在缓存查询结果：

  ```objc
  BOOL isInCache = [query hasCachedResult];
  ```

- 删除某一查询的任何缓存结果：（删除缓存只影响持久化缓存（磁盘缓存），不影响内存缓存，下同）

  ```objc
  [query clearCachedResult];
  ```

- 删除查询的所有缓存结果：

  ```objc
  [LCQuery clearAllCachedResults];
  ```

- 设定缓存结果的最长时限：

  ```objc
  query.maxCacheAge = 60 * 60 * 24; // 一天的总秒数
  ```

查询缓存也适用于 `LCQuery` 的辅助方法，包括 `getFirstObject` 和 `getObjectInBackground`。

### 查询性能优化

影响查询性能的因素很多。特别是当查询结果的数量超过 10 万，查询性能可能会显著下降或出现瓶颈。以下列举一些容易降低性能的查询方式，开发者可以据此进行有针对性的调整和优化，或尽量避免使用。

- 不等于和不包含查询（无法使用索引）
- 通配符在前面的字符串查询（无法使用索引）
- 有条件的 `count`（需要扫描所有数据）
- `skip` 跳过较多的行数（相当于需要先查出被跳过的那些行）
- 无索引的排序（另外除非复合索引同时覆盖了查询和排序，否则只有其中一个能使用索引）
- 无索引的查询（另外除非复合索引同时覆盖了所有条件，否则未覆盖到的条件无法使用索引，如果未覆盖的条件区分度较低将会扫描较多的数据）

## LiveQuery

LiveQuery 衍生于 [`LCQuery`](#查询)，并为其带来了更强大的功能。它可以让你无需编写复杂的逻辑便可在客户端之间同步数据，这对于有实时数据同步需求的应用来说很有帮助。

设想你正在开发一个多人协作同时编辑一份文档的应用，单纯地使用 `LCQuery` 并不是最好的做法，因为它只具备主动拉取的功能，而应用并不知道什么时候该去拉取。

想要解决这个问题，就要用到 LiveQuery 了。借助 LiveQuery，你可以订阅所有需要保持同步的 `LCQuery`。订阅成功后，一旦有符合 `LCQuery` 的 `LCObject` 发生变化，云端就会主动、实时地将信息通知到客户端。

LiveQuery 使用 WebSocket 在客户端和云端之间建立连接。WebSocket 的处理会比较复杂，而我们将其封装成了一个简单的 API 供你直接使用，无需关注背后的原理。

### 启用 LiveQuery

进入 **控制台 > 存储 > 设置**，在 **其他** 里面勾选 **启用 LiveQuery**

如果没有集成 `Realtime` 模块，需先集成 `Realtime` 模块，pod 添加示例如下：

```ruby
pod 'LeanCloudObjc/Realtime'
```

可以在 [SDK 安装与初始化](#SDK-安装与初始化) 中找到完整设置方法。

之后在相关头文件中导入 `Realtime` 模块，示例如下：

```objc
#import <LeanCloudObjc/Realtime.h>
```


### Demo

下面是在使用了 LiveQuery 的网页应用和手机应用中分别操作，数据保持同步的效果：

<video src="https://capacity-files.lncld.net/1496988080458" controls autoplay muted preload="auto" width="100%" height="100%" >
HTML5 Video is required for this demo, which your browser doesn't support.
</video>

使用我们的「LeanTodo」微信小程序和网页应用，可以实际体验以上视频所演示的效果，步骤如下：

1. 微信扫码，添加小程序「LeanTodo」；

    ![LeanTodo mini program](/img/leantodo-weapp-qr.jpg)

2. 进入小程序，点击首页左下角 **设置** > **账户设置**，输入便于记忆的用户名和密码；

3. 使用浏览器访问 <https://leancloud.github.io/leantodo-vue/>，输入刚刚在小程序中更新好的账户信息，点击 **Login**；

4. 随意添加更改数据，查看两端的同步状态。

注意按以上顺序操作。在网页应用中使用 **Signup** 注册的账户无法与小程序创建的账户相关联，所以如果颠倒以上操作顺序，则无法观测到数据同步效果。

[LiveQuery 公开课](http://www.bilibili.com/video/av11291992/) 涵盖了许多开发者关心的问题和解答。

### 构建订阅

首先创建一个普通的 `LCQuery` 对象，添加查询条件（如有），然后进行订阅操作：

```objc
LCQuery *query = [LCQuery queryWithClassName:@"Todo"];
self.liveQuery = [[LCLiveQuery alloc] initWithQuery:query];
self.liveQuery.delegate = self;
[self.liveQuery subscribeWithCallback:^(BOOL succeeded, NSError * _Nonnull error) {
    // 订阅成功
}];
```


LiveQuery 不支持内嵌查询，也不支持返回指定属性。

订阅成功后，就可以接收到和 `LCObject` 相关的更新了。假如在另一个客户端上创建了一个 `Todo` 对象，对象的 `title` 设为 `更新作品集`，那么下面的代码可以获取到这个新的 `Todo`：

```objc
LCQuery *query = [LCQuery queryWithClassName:@"Todo"];
self.liveQuery = [[LCLiveQuery alloc] initWithQuery:query];
self.liveQuery.delegate = self;
[self.liveQuery subscribeWithCallback:^(BOOL succeeded, NSError * _Nonnull error) {
    // 订阅成功
}];
- (void)liveQuery:(LCLiveQuery *)liveQuery objectDidCreate:(id)object {
    if (liveQuery == self.liveQuery) {
        NSLog(@"%@", object[@"title"]); // 更新作品集
    }
}
```


此时如果有人把 `Todo` 的 `content` 改为 `把我最近画的插画放上去`，那么下面的代码可以获取到本次更新：

```objc
- (void)liveQuery:(LCLiveQuery *)liveQuery objectDidUpdate:(id)updatedTodo updatedKeys:(NSArray<NSString *> *)updatedKeys {
    NSLog(@"%@", updatedTodo[@"content"]); // 把我最近画的插画放上去
}
```


### 事件处理

订阅成功后，可以选择监听如下几种数据变化：

- `create`
- `update`
- `enter`
- `leave`
- `delete`

#### `create` 事件

当有新的满足 `LCQuery` 查询条件的 `LCObject` 被创建时，`create` 事件会被触发。下面的 `object` 就是新建的 `LCObject`：

```objc
- (void)liveQuery:(LCLiveQuery *)liveQuery objectDidCreate:(id)object {
    if (liveQuery == self.liveQuery) {
        NSLog(@"对象被创建。");
    }
}
```


#### `update` 事件

当有满足 `LCQuery` 查询条件的 `LCObject` 被更新时，`update` 事件会被触发。下面的 `object` 就是有更新的 `LCObject`：

```objc
- (void)liveQuery:(LCLiveQuery *)liveQuery objectDidUpdate:(id)object updatedKeys:(NSArray<NSString *> *)updatedKeys {
    if (liveQuery == self.liveQuery) {
        NSLog(@"对象被更新。");
    }
}
```


#### `enter` 事件

当一个已存在的、原本不符合 `LCQuery` 查询条件的 `LCObject` 发生更新，且更新后符合查询条件，`enter` 事件会被触发。下面的 `object` 就是进入 `LCQuery` 的 `LCObject`，其内容为该对象最新的值：

```objc
- (void)liveQuery:(LCLiveQuery *)liveQuery objectDidEnter:(id)object updatedKeys:(nonnull NSArray<NSString *> *)updatedKeys {
    if (liveQuery == self.liveQuery) {
        NSLog(@"对象进入。");
    }
}
```


注意区分 `create` 和 `enter` 的不同行为。如果一个对象已经存在，在更新之前不符合查询条件，而在更新之后符合查询条件，那么 `enter` 事件会被触发。如果一个对象原本不存在，后来被构建了出来，那么 `create` 事件会被触发。

#### `leave` 事件

当一个已存在的、原本符合 `LCQuery` 查询条件的 `LCObject` 发生更新，且更新后不符合查询条件，`leave` 事件会被触发。下面的 `object` 就是离开 `LCQuery` 的 `LCObject`，其内容为该对象最新的值：

```objc
- (void)liveQuery:(LCLiveQuery *)liveQuery objectDidLeave:(id)object updatedKeys:(nonnull NSArray<NSString *> *)updatedKeys {
    if (liveQuery == self.liveQuery) {
        NSLog(@"对象离开。");
    }
}
```


#### `delete` 事件

当一个已存在的、原本符合 `LCQuery` 查询条件的 `LCObject` 被删除，`delete` 事件会被触发。下面的 `object` 就是被删除的 `LCObject` 的 `objectId`：

```objc
- (void)liveQuery:(LCLiveQuery *)liveQuery objectDidDelete:(id)object {
    if (liveQuery == self.liveQuery) {
        NSLog(@"对象被删除。");
    }
}
```

### 取消订阅

如果不再需要接收有关 `LCQuery` 的更新，可以取消订阅。

```objc
[liveQuery unsubscribeWithCallback:^(BOOL succeeded, NSError * _Nonnull error) {
    if (succeeded) {
        // 成功取消订阅
    } else {
        // 错误处理
    }
}];
```


### 断开连接

断开连接有几种情况：

1. 网络异常或者网络切换，非预期性断开。
2. 退出应用、关机或者打开飞行模式等，用户在应用外的操作导致断开。

如上几种情况开发者无需做额外的操作，只要切回应用，SDK 会自动重新订阅，数据变更会继续推送到客户端。

而另外一种极端情况——**当用户在移动端使用手机的进程管理工具，杀死了进程或者直接关闭了网页的情况下**，SDK 无法自动重新订阅，此时需要开发者根据实际情况实现重新订阅。

### LiveQuery 的注意事项

因为 LiveQuery 的实时性，很多用户会陷入一个误区，试着用 LiveQuery 来实现一个简单的聊天功能。
我们不建议这样做，因为使用 LiveQuery 构建聊天服务会承担额外的存储成本，产生的费用会增加，后期维护的难度非常大（聊天记录、对话维护之类的代码会很混乱），并且云服务已经提供了即时通讯的服务。
LiveQuery 的核心还是提供一个针对查询的推拉结合的用法，脱离设计初衷容易造成前端的模块混乱。

## 文件

有时候应用需要存储尺寸较大或结构较为复杂的数据，这类数据不适合用 `LCObject` 保存，此时文件对象 `LCFile` 便成为了更好的选择。文件对象最常见的用途是保存图片，不过也可以用来保存文档、视频、音乐等其他二进制数据。

### 构建文件


可以通过字符串构建文件：

```objc
NSData *data = [@"LeanCloud" dataUsingEncoding:NSUTF8StringEncoding];
// resume.txt 是文件名
LCFile *file = [LCFile fileWithData:data name:@"resume.txt"];
```

除此之外，还可以通过 URL 构建文件：

```objc
LCFile *file = [LCFile fileWithRemoteURL:[NSURL URLWithString:@"https://leancloud.cn/assets/imgs/press/Logo%20-%20Blue%20Padding.a60eb2fa.png"]];
```

通过 URL 构建文件时，SDK 并不会将原本的文件转储到云端，而是会将文件的物理地址存储为字符串，这样也就不会产生任何文件上传流量。使用其他方式构建的文件会被保存在云端。

云端会根据文件扩展名自动检测文件类型。如果需要的话，也可以手动指定 `Content-Type`（一般称为 MIME 类型）：

与前面提到的方式相比，一个更常见的文件构建方式是从本地路径上传。


```objc
NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
NSString *documentsDirectory = [paths objectAtIndex:0];
NSString *imagePath = [documentsDirectory stringByAppendingPathComponent:@"avatar.jpg"];
NSError *error;
LCFile *file = [LCFile fileWithLocalPath:imagePath error:&error];
```

这里上传的文件名字叫做 `avatar.jpg`。需要注意：

- 每个文件会被分配到一个独一无二的 `objectId`，所以在一个应用内是允许多个文件重名的。
- 文件必须有扩展名才能被云端正确地识别出类型。比如说要用 `LCFile` 保存一个 PNG 格式的图像，那么扩展名应为 `.png`。
- 如果文件没有扩展名，且没有手动指定类型，那么云服务将默认使用 `application/octet-stream`。

### 保存文件

将文件保存到云端后，便可获得一个永久指向该文件的 URL：

```objc
[file uploadWithCompletionHandler:^(BOOL succeeded, NSError *error) {
    if (succeeded) {
        NSLog(@"文件保存完成。URL: %@", file.url);
    } else {
        // 保存失败，可能是文件无法被读取，或者上传过程中出现问题
    }
}];
```

文件上传后，可以在 `_File` class 中找到。已上传的文件无法再被修改。如果需要修改文件，只能重新上传修改过的文件并取得新的 `objectId` 和 URL。


已经保存到云端的文件可以关联到 `LCObject`：

```objc
LCObject *todo = [LCObject objectWithClassName:@"Todo"];
[todo setObject:@"买蛋糕" forKey:@"title"];
// attachments 是一个 Array 属性
[todo addObject:file forKey:@"attachments"];
[todo saveInBackground];
```

也可以通过构建 `LCQuery` 进行[查询](#查询)：

```objc
LCQuery *query = [LCQuery queryWithClassName:@"_File"];
```


需要注意的是，内部文件（上传到文件服务的文件）的 `url` 字段是由云端动态生成的，其中涉及切换自定义域名的相关处理逻辑。
因此，通过 url 字段查询文件仅适用于外部文件（直接保存外部 URL 到 `_File` 表创建的文件），内部文件请改用 key 字段（URL 中的路径）查询。

注意，如果文件被保存到了 `LCObject` 的一个数组属性中，那么在查询 `LCObject` 时如果需要包含文件，则要用到 `LCQuery` 的 `includeKey` 方法。比如说，在获取所有标题为 `买蛋糕` 的 todo 的同时获取附件中的文件：

```objc
// 获取同一标题且包含附件的 todo
LCQuery *query = [LCQuery queryWithClassName:@"Todo"];
[query whereKey:@"title" equalTo:@"买蛋糕"];
[query whereKeyExists:@"attachments"];

// 同时获取附件中的文件
[query includeKey:@"attachments"];

[query findObjectsInBackgroundWithBlock:^(NSArray * _Nullable todos, NSError * _Nullable error) {
    for (LCObject *todo in todos) {
        // 获取每个 todo 的 attachments 数组
        // {# TODO #}
    }
}];
```


### 上传进度监听

上传过程中可以实时向用户展示进度：

```objc
[file uploadWithProgress:^(NSInteger percent) {
    // percent 是一个 0 到 100 之间的整数，表示上传进度
} completionHandler:^(BOOL succeeded, NSError *error) {
    // 保存后的操作
}];
```

### 文件元数据

上传文件时，可以用 `metaData` 添加额外的属性。文件一旦保存，`metaData` 便不可再修改。

```objc
// 设置元数据
[file.metaData setObject:@"LeanCloud" forKey:@"author"];
[file uploadWithCompletionHandler:^(BOOL succeeded, NSError *error) {
    // 获取全部元数据
    NSDictionary *metadata = file.metaData;
    // 获取 author 属性
    NSString *author = metadata[@"author"];
    // 获取文件名
    NSString *fileName = file.name;
    // 获取大小（不适用于通过 base64 编码的字符串或者 URL 保存的文件）
    NSUInteger *size = file.size;
}];
```

### 文件下载

客户端 SDK 接口可以下载文件并把它缓存起来，只要文件的 URL 不变，那么一次下载成功之后，就不会再重复下载，目的是为了减少客户端的流量。

```objc
[file downloadWithProgress:^(NSInteger number) {
    // 下载的进度数据，number 介于 0 和 100
} completionHandler:^(NSURL * _Nullable filePath, NSError * _Nullable error) {
    // filePath 是文件下载到本地的地址
}];
```

`filePath` 是一个相对路径，文件存储在缓存目录（使用缓存功能）或系统临时目录（不使用缓存功能）中。

请注意代码中 `下载进度` 数据的读取。

### 图像缩略图

成功保存图像后，除了可以获取指向该文件的 URL 外，还可以获取图像的缩略图 URL，并且可以指定缩略图的宽度和高度：

```objc
LCFile *file = [LCFile fileWithRemoteURL:[NSURL URLWithString:@"文件-url"]];
[file getThumbnail:YES width:100 height:100 withBlock:^(UIImage *image, NSError *error) {
    // 其他逻辑
}];
```

图片最大不超过 **20 MB** 才可以获取缩略图。

国际版不支持图片缩略图。

### 清除缓存

LCFile 也提供了清除缓存的方法：

```objc
// 清除当前文件缓存
- (void)clearPersistentCache;

// 类方法，清除所有缓存
+ (BOOL)clearAllPersistentCache;
```


### 删除文件

下面的代码从云端删除一个文件：

```objc
LCFile *file = [LCFile getFileWithObjectId:@"552e0a27e4b0643b709e891e"];
[file deleteInBackground];
```

默认情况下，文件的删除权限是关闭的，需要进入 **云服务控制台 > 数据存储 > 结构化数据 > `_File`**，选择 **其他** > **权限设置** > **`delete`** 来开启。

#### iOS 9 适配

从 iOS 9 开始，Apple 默认屏蔽 HTTP 访问，只支持 HTTPS 访问。云服务除了 `LCFile` 的 `getData` 之外的 API 都支持通过 HTTPS 访问。

如果你仍然需要 HTTP 访问，例如即时通讯消息中仍然有使用 HTTP 域名的文件，你可以 **为项目配置访问策略来允许 HTTP 访问**，从而解决这个问题。方法如下：

选择项目的 `Info.plist`，右击选择 **Opened As** > **Source Code**，在 **plist** > **dict** 节点中加入以下文本：

```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSExceptionDomains</key>
  <dict>
    <key>clouddn.com</key>
    <dict>
      <key>NSIncludesSubdomains</key>
      <true/>
      <key>NSTemporaryExceptionAllowsInsecureHTTPLoads</key>
      <true/>
    </dict>
  </dict>
</dict>
```

或者在 **Target** 的 **Info** 标签中修改配置：

![在「NSAppTransportSecurity > NSExceptionDomains > clouddn.com」下面分别添加「NSTemporaryExceptionAllowsInsecureHTTPLoads」和「NSIncludesSubdomains」两个 Boolean 字段并将它们的值设为 YES。](/img/ios_qiniu_http.png)

你也可以根据项目需要，允许所有的 HTTP 访问，更多可参考 [iOS 9 适配系列教程](https://github.com/ChenYilong/iOS9AdaptationTips)。


## GeoPoint

云服务允许你通过将 `LCGeoPoint` 关联到 `LCObject` 的方式存储折射真实世界地理位置的经纬坐标，这样做可以让你查询包含一个点附近的坐标的对象。常见的使用场景有「查找附近的用户」和「查找附近的地点」。

要构建一个包含地理位置的对象，首先要构建一个地理位置。下面的代码构建了一个 `LCGeoPoint` 并将其纬度（`latitude`）设为 `39.9`，经度（`longitude`）设为 `116.4`：

```objc
LCGeoPoint *point = [LCGeoPoint geoPointWithLatitude:39.9 longitude:116.4];
```


现在可以将这个地理位置存储为一个对象的属性：

```objc
[todo setObject:point forKey:@"location"];
```

### 地理位置查询

给定一些含有地理位置的对象，可以从中找出离某一点最近的几个，或者处于某一范围内的几个。要执行这样的查询，可以向普通的 `LCQuery` 添加 `nearGeoPoint` 条件。下面的代码查找 `location` 属性值离某一点最近的 `Todo` 对象：

```objc
LCQuery *query = [LCQuery queryWithClassName:@"Todo"];
LCGeoPoint *point = [LCGeoPoint geoPointWithLatitude:39.9 longitude:116.4];
[query whereKey:@"location" nearGeoPoint:point];

// 限制为 10 条结果
query.limit = 10;
[query findObjectsInBackgroundWithBlock:^(NSArray *todos, NSError *error) {
    // todos 是包含满足条件的 Todo 对象的数组
}];
```

像 `orderByAscending` 和 `orderByDescending` 这样额外的排序条件会获得比默认的距离排序更高的优先级。

若要限制结果和给定地点之间的距离，可以参考 API 文档中的 `withinKilometers`、`withinMiles` 和 `withinRadians` 参数。

若要查询在某一矩形范围内的对象，可以用 `withinGeoBoxFromSouthwest` 和 `toNortheast`：

![withinGeoBox](/img/geopoint-withingeobox.svg)

```objc
LCQuery *query = [LCQuery queryWithClassName:@"Todo"];
LCGeoPoint *southwest = [LCGeoPoint geoPointWithLatitude:30 longitude:115];
LCGeoPoint *northeast = [LCGeoPoint geoPointWithLatitude:40 longitude:118];
[query whereKey:@"location" withinGeoBoxFromSouthwest:southwest toNortheast:northeast];
```

### GeoPoint 的注意事项

GeoPoint 的经纬度的类型是数字，且经度需在 -180.0 到 180.0 之间，纬度需在 -90.0 到 90.0 之间。
另外，每个对象最多只能有一个类型为 GeoPoint 的属性。

iOS 8.0 之后，使用定位服务之前，需要调用 `[locationManager requestWhenInUseAuthorization]` 或 `[locationManager requestAlwaysAuthorization]` 来获取用户的「使用期授权」或「永久授权」，而这两个请求授权需要在 `info.plist` 里面对应添加 `NSLocationWhenInUseUsageDescription` 或 `NSLocationAlwaysUsageDescription` 的键值对，值为开启定位服务原因的描述。SDK 内部默认使用的是「使用期授权」。

## 用户

请参阅[内建账户指南](/sdk/authentication/guide/)。

## 角色

随着用户量的增长，你可能会发现相比于为每一名用户单独设置权限，将预先设定好的权限直接分配给一部分用户是更好的选择。为了迎合这种需求，云服务支持基于角色的权限管理。请参阅[《ACL 权限管理开发指南》](https://leancloud.cn/docs/acl-guide.html)。
## 子类化

子类化推荐给进阶的开发者在进行代码重构的时候做参考。你可以用 `LCObject` 访问到所有的数据，用 `objectForKey:` 获取任意字段。在成熟的代码中，子类化有很多优势，包括降低代码量，具有更好的扩展性，和支持自动补全。

子类化是可选的，请对照下面的例子来加深理解：

```objc
LCObject *student = [LCObject objectWithClassName:@"Student"];
[student setObject:@"小明" forKey:@"name"];
[student saveInBackground];
```

可改写成：

```objc
Student *student = [Student object];
student.name = @"小明";
[student saveInBackground];
```

这样代码看起来是不是更简洁呢？

### 子类化的实现

要实现子类化，需要下面几个步骤：

1. 导入 `LCObject+Subclass.h`；
2. 继承 `LCObject` 并实现 `LCSubclassing` 协议；
3. 实现类方法 `parseClassName`，返回的字符串是原先要传给 `initWithClassName:` 的参数，这样后续就不必再进行类名引用了。如果不实现，默认返回的是类的名字。**请注意：`LCUser` 子类化后必须返回 `_User`**；
4. 在实例化子类之前调用 `[YourClass registerSubclass]`（**在应用当前生命周期中，只需要调用一次**。可在子类的 `+load` 方法或者 `UIApplication` 的 `-application:didFinishLaunchingWithOptions:` 方法里面调用）。

下面是实现 `Student` 子类化的例子：

```objc
// Student.h
@interface Student : LCObject <LCSubclassing>

@property(nonatomic,copy) NSString *name;

@end


// Student.m
#import "Student.h"

@implementation Student

@dynamic name;

+ (NSString *)parseClassName {
    return @"Student";
}

@end


// AppDelegate.m
#import "Student.h"

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
[Student registerSubclass];
[LCApplication setApplicationId:{{appid}}
                        clientKey:{{appkey}}
                serverURLString:"https://please-replace-with-your-customized.domain.com"];
}
```

### 属性

为 `LCObject` 的子类添加自定义的属性和方法，可以更好地将这个类的逻辑封装起来。用 `LCSubclassing` 可以把所有的相关逻辑放在一起，这样不必再使用不同的类来区分业务逻辑和存储转换逻辑了。

`LCObject` 支持动态 synthesizer，就像 `NSManagedObject` 一样。先正常声明一个属性，只是在 `.m` 文件中把 `@synthesize` 变成 `@dynamic`。

请看下面的例子是怎么添加一个「年龄」属性：

```objc
// Student.h
@interface Student : LCObject <LCSubclassing>

@property int age;

@end


// Student.m
#import "Student.h"

@implementation Student

@dynamic age;
```

这样就可以通过 `student.age = 19` 这样的方式来读写 `age` 字段了，当然也可以写成：

```objc
[student setAge:19]
```

**注意：属性名称保持首字母小写**（错误：`student.Age`；正确：`student.age`）。

`NSNumber` 类型的属性可用 `NSNumber` 或者是它的原始数据类型（`int`、`long` 等）来实现。例如，`[student objectForKey:@"age"]` 返回的是 `NSNumber` 类型，而实际被设为 `int` 类型。

你可以根据自己的需求来选择使用哪种类型。原始类型更为易用，而 `NSNumber` 支持 `nil` 值，这可以让结果更清晰易懂。

注意：`LCRelation` 同样可以作为子类化的一个属性来使用，比如：

```objc
@interface Student : LCUser <LCSubclassing>
@property(retain) LCRelation *friends;
// ...
@end

@implementation Student
@dynamic friends;
// ...
```

另外，值为 `Pointer` 的实例可用 `LCObject*` 来表示。例如，如果 `Student` 中 `bestFriend` 代表一个指向另一个 `Student` 的键，由于 `Student` 是一个 `LCObject`，因此在表示这个键的值的时候，可以用一个 `LCObject*` 来代替：

```objc
@interface Student : LCUser <LCSubclassing>
@property(nonatomic, strong) LCObject *bestFriend;
 …
@end

@implementation Student
@dynamic bestFriend;
  …
```

提示：当需要更新的时候，最后都要记得加上 `[student save]` 或者对应的后台存储函数进行更新，才会同步至服务器。

如果要使用更复杂的逻辑而不是简单的属性访问，可以这样实现：

```objc
  @dynamic iconFile;

  - (UIImageView *)iconView {
    UIImageView *view = [[UIImageView alloc] initWithImage:kPlaceholderImage];
    view.image = [UIImage imageNamed:self.iconFile];
    return [view autorelease];
  }

```

### 针对 LCUser 子类化的特别说明

假如现在已经有一个基于 `LCUser` 的子类，如上面提到的 `Student`：

```objc
@interface Student : LCUser<LCSubclassing>
@property NSString *displayName;
@end


@implementation Student
@dynamic displayName;
+ (NSString *)parseClassName {
    return @"_User";
}
@end
```

登录时需要调用 `Student` 的登录方法才能通过 `currentUser` 得到这个子类：

```objc
[Student logInWithUsernameInBackground:@"USER_NAME" password:@"PASSWORD" block:^(LCUser *user, NSError *error) {
        Student *student = [Student currentUser];
        student.displayName = @"YOUR_DISPLAY_NAME";
    }];
```

同样需要调用 `[Student registerSubclass];`，确保在其它地方得到的对象是 `Student`，而非 `LCUser`。

### 初始化子类

创建一个子类实例，要使用 `object` 类方法。要创建并关联到已有的对象，请使用 `objectWithObjectId:` 类方法。

### 子类查询

使用类方法 `query` 可以得到这个子类的查询对象。

例如，查询年龄小于 21 岁的学生：

```objc
  LCQuery *query = [Student query];
  [query whereKey:@"age" lessThanOrEqualTo:@(21)];
  [query findObjectsInBackgroundWithBlock:^(NSArray *objects, NSError *error) {
    if (!error) {
      Student *stu1 = [objects objectAtIndex:0];
      // …
    }
  }];
```

## 全文搜索

全文搜索是一个针对应用数据进行全局搜索的接口，它基于搜索引擎构建，提供更强大的搜索功能。要深入了解其用法和阅读示例代码，请阅读[全文搜索指南](/sdk/storage/guide/fulltext-search/)。
