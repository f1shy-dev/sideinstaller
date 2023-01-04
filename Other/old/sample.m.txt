#include "sample.h"

@implementation Sample
-(void)sayHello {

    AKDevice *device = [AKDevice currentDevice];
    id headers = [AOSUtilities retrieveOTPHeadersForDSID:@"-2"];

    NSISO8601DateFormatter *formatter = [[NSISO8601DateFormatter alloc]
    init]; NSString *dateString = [formatter stringFromDate:[NSDate date]];

    NSDictionary *dict = @{
      @"X-Apple-I-Client-Time" : dateString,
      @"X-Apple-MD" : [headers valueForKey:@"X-Apple-MD"],
      @"X-Apple-MD-LU" : [device localUserUUID],
      @"X-Apple-MD-M" : [headers valueForKey:@"X-Apple-MD-M"],
      @"X-Apple-I-MD-RINFO" : @"0",
      @"X-Apple-I-SRL-NO" : [AOSUtilities machineSerialNumber],
      @"X-Apple-I-TimeZone" : [[NSTimeZone systemTimeZone] abbreviation],
      @"X-Apple-Locale" : [[device locale] localeIdentifier],
      @"X-MMe-Client-Info" : [device serverFriendlyDescription],
      @"X-Mme-Device-Id" : [device uniqueDeviceIdentifier]
    };

//   NSDictionary *dict = @{@"ok" : @"yes!!"};

  NSError *error;
  NSData *jsonData =
      [NSJSONSerialization dataWithJSONObject:dict
                                      options:NSJSONWritingPrettyPrinted
                                        error:&error];

  if (!jsonData) {
    NSLog(@"Got an error while parsing to JSON.");
  } else {
    NSString *jsonstr =  [[NSString alloc] initWithData:jsonData
                                 encoding:NSUTF8StringEncoding];

    NSLog(@"%@", jsonstr);
  }


    NSLog(@"Hello objective-c!");
}
@end
