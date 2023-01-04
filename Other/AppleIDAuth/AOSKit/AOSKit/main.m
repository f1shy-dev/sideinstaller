#import <Foundation/Foundation.h>
#import "AKURLBag.h"

@interface AOSUtilities : NSObject
+ (id)currentComputerName;
+ (id)machineUDID;
+ (id)machineSerialNumber;
+ (id)retrieveOTPHeadersForDSID:(id)arg1;
@end

@interface AKDevice : NSObject
+ (id)currentDevice;
- (id)localUserUUID;
- (id)locale;
- (id)serverFriendlyDescription;
- (id)uniqueDeviceIdentifier;
@end

#define NSLog(FORMAT, ...) fprintf( stderr, "%s\n", [[NSString stringWithFormat:FORMAT, ##__VA_ARGS__] UTF8String] );


int main(int argc, const char * argv[]) {
    @autoreleasepool {
        NSLog(@"%@", [[AKURLBag sharedBag] syncAnisetteURL]);
        AKDevice *device = [AKDevice currentDevice];
        id headers = [AOSUtilities retrieveOTPHeadersForDSID:@"-2"];

        NSISO8601DateFormatter *formatter = [[NSISO8601DateFormatter alloc] init];
        NSString *dateString = [formatter stringFromDate:[NSDate date]];

        NSDictionary *dict = @{
            @"X-Apple-I-Client-Time":dateString,
            @"X-Apple-MD" : [headers valueForKey:@"X-Apple-MD"],
            @"X-Apple-MD-LU": [device localUserUUID],
            @"X-Apple-MD-M" : [headers valueForKey:@"X-Apple-MD-M"],
            @"X-Apple-I-MD-RINFO": @"0",
            @"X-Apple-I-SRL-NO": [AOSUtilities machineSerialNumber],
            @"X-Apple-I-TimeZone": [[NSTimeZone systemTimeZone] abbreviation],
            @"X-Apple-Locale": [[device locale] localeIdentifier],
            @"X-MMe-Client-Info": [device serverFriendlyDescription],
            @"X-Mme-Device-Id": [device uniqueDeviceIdentifier]
        };
        
        NSError *error;
        NSData *jsonData = [NSJSONSerialization dataWithJSONObject:dict
                                                           options:NSJSONWritingPrettyPrinted
                                                             error:&error];

        if (! jsonData) {
            NSLog(@"Got an error: %@", error);
        } else {
            NSString *jsonString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
            NSLog(@"%@", jsonString);
        }
        
        
        
    }
    return 0;
}
