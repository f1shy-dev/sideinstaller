//
//  AKNativeAnisetteService.m
//  akd
//
//  Created by Scott Knight on 5/10/19.
//  Copyright © 2019 Scott Knight. All rights reserved.
//

#import <AuthKit/AuthKit.h>
#import "AKClient.h"
#import "AKADIProxy.h"
#import "AKURLBagService.h"

dispatch_queue_t gAnisetteQueue;

@implementation AKNativeAnisetteService

+ (unsigned long long)activeAnisetteDSIDWithEnvironment:(unsigned long long)env {
    if (env == 0) {
        return 0xfffffffffffffffe;
    }
    
    if (env <= 2) {
        if (os_log_type_enabled(_AKTrafficLogSubsystem(), OS_LOG_TYPE_DEBUG)) {
            os_log_debug(_AKTrafficLogSubsystem(), "Using QA Anisette DSID.");
        }
        return 0xfffffffffffffffd;
    } else if (env == 3) {
        if (os_log_type_enabled(_AKTrafficLogSubsystem(), OS_LOG_TYPE_DEBUG)) {
            os_log_debug(_AKTrafficLogSubsystem(), "Using QA2 Anisette DSID.");
        }
        return 0xfffffffffffffffc;
    } else {
        if (os_log_type_enabled(_AKTrafficLogSubsystem(), OS_LOG_TYPE_DEBUG)) {
            os_log_debug(_AKTrafficLogSubsystem(), "Using some other non-prod Anisette DSID.");
        }
        return 0xfffffffffffffffb;
    }
}

+ (unsigned long long)lastKnownActiveAnisetteDSID {
    unsigned long long env = [[AKURLBag sharedBag] lastKnownIDMSEnvironment];
    return [self activeAnisetteDSIDWithEnvironment:env];
}

+ (void)initialize {
    if (gAnisetteQueue== nil) {
        dispatch_queue_attr_t attr = dispatch_queue_attr_make_with_autorelease_frequency(NULL,
                                                                                         DISPATCH_AUTORELEASE_FREQUENCY_WORK_ITEM);
        gAnisetteQueue = dispatch_queue_create("com.apple.akd.anisette", attr);
    }
}

- (instancetype)initWithClient:(AKClient *)client {
    self = [super init];
    if (self) {
        _client = client;
    }
    return self;
}

- (void)_signRequestWithProvisioningHeaders:(NSMutableURLRequest *)request {
    [request ak_addClientInfoHeader];
    [request ak_addClientTimeHeader];
    [request ak_addDeviceMLBHeader];
    [request ak_addDeviceROMHeader];
    [request ak_addDeviceSerialNumberHeader];
    [request ak_addDeviceUDIDHeader];
    [request ak_addLocalUserUUIDHashHeader];
    
    if (self->_client.name.length > 0) {
        [request ak_addClientApp:self->_client.name];
    }
}

- (NSURLRequest *)_createSyncURLRequestWithMID:(NSData *)mid SRM:(NSData *)srm routingInfo:(unsigned long long)routingInfo {
    NSMutableURLRequest *result = nil;
    
    NSURL *syncURL = [[AKURLBag sharedBag] syncAnisetteURL];
    if (!syncURL) {
        if (os_log_type_enabled(_AKLogSystem(), OS_LOG_TYPE_ERROR)) {
            os_log_error(_AKLogSystem(), "Nil value for syncAnisetteURL!");
        }
    } else {
        result = [NSMutableURLRequest requestWithURL:syncURL];
        [result setHTTPMethod:@"POST"];
        [self _signRequestWithProvisioningHeaders:result];
        
        NSMutableDictionary *body = [[NSMutableDictionary alloc] init];
        if (srm != nil) {
            body[@"srm"] = [srm base64EncodedStringWithOptions:0];
        }
        
        if (mid != nil) {
            body[@"X-Apple-I-MD-M"] = [mid base64EncodedStringWithOptions:0];
        }
        
        if (routingInfo != 0) {
            body[@"X-Apple-I-MD-RINF"] = [NSNumber numberWithUnsignedLongLong:routingInfo];
        }
        
        [result ak_setBodyWithParameters:@{@"Header":@{}, @"Request":body}];
    }
    
    return result;
}

- (NSURLRequest *)_createProvisioningEndURLRequestWithCPIM:(NSData *)cpim {
    NSMutableURLRequest *result = nil;
    
    NSURL *endURL = [[AKURLBag sharedBag] endProvisioningURL];
    if (!endURL) {
        if (os_log_type_enabled(_AKLogSystem(), OS_LOG_TYPE_ERROR)) {
            os_log_error(_AKLogSystem(), "Nil value for endProvisioningURL!");
        }
    } else {
        result = [NSMutableURLRequest requestWithURL:endURL];
        [result setHTTPMethod:@"POST"];
        [self _signRequestWithProvisioningHeaders:result];
        
        NSMutableDictionary *body = [[NSMutableDictionary alloc] init];
        if (cpim != nil) {
            body[@"cpim"] = [cpim base64EncodedStringWithOptions:0];
        }
        
        [result ak_setBodyWithParameters:@{@"Header":@{}, @"Request":body}];
    }
    
    return result;
}

- (id)_createProvisioningStartURLRequest {
    NSMutableURLRequest *result = nil;
    
    NSURL *startURL = [[AKURLBag sharedBag] startProvisioningURL];
    if (!startURL) {
        if (os_log_type_enabled(_AKLogSystem(), OS_LOG_TYPE_ERROR)) {
            os_log_error(_AKLogSystem(), "Nil value for startProvisioningURL!");
        }
    } else {
        result = [NSMutableURLRequest requestWithURL:startURL];
        [result setHTTPMethod:@"POST"];
        [self _signRequestWithProvisioningHeaders:result];
        
        [result ak_setBodyWithParameters:@{@"Header":@{}, @"Request":@{}}];
    }
    
    return result;
}

- (void)fetchAnisetteDataAndProvisionIfNecessary:(BOOL)provision withCompletion:(void (^)(AKAnisetteData *, NSError *))completion {
    dispatch_async(gAnisetteQueue, ^{
        NSError *error = nil;
        unsigned long long dsid = [self.class lastKnownActiveAnisetteDSID];
        AKAnisetteData *anisetteData = [self _unsafe_anisetteDataWithRoutingInfoForDSID:dsid withError:&error];
        NSError *underlyingError = [[error userInfo] objectForKeyedSubscript:NSUnderlyingErrorKey];

        if (anisetteData == nil && [underlyingError code] == -45061) {
            // I would assume -45061 indicates there is nothing yet provisioned for this machine
            // in turn we attempt to provisionn if requested
            if (provision) {
                if (os_log_type_enabled(_AKTrafficLogSubsystem(), OS_LOG_TYPE_DEBUG)) {
                    os_log_debug(_AKTrafficLogSubsystem(), "Client requested that we attempt provisioning...");
                }
                [self _unsafe_provisionAnisetteWithCompletion:^(BOOL succeeded, NSError *error) {
                    if (!succeeded) {
                        if (os_log_type_enabled(_AKTrafficLogSubsystem(), OS_LOG_TYPE_ERROR)) {
                            os_log_error(_AKTrafficLogSubsystem(), "Provisioning failed. No Anisette for you today! Error: %@", error);
                        }
                        completion(nil, error);
                    } else {
                        dispatch_async(gAnisetteQueue, ^{
                            if (os_log_type_enabled(_AKTrafficLogSubsystem(), OS_LOG_TYPE_DEBUG)) {
                                os_log_debug(_AKTrafficLogSubsystem(), "Provisioning succeeded");
                            }
                            
                            NSError *newError = nil;
                            unsigned long long dsid = [AKNativeAnisetteService lastKnownActiveAnisetteDSID];
                            AKAnisetteData *newData = [self _unsafe_anisetteDataWithRoutingInfoForDSID:dsid withError:&newError];
                            if (newError) {
                                if (os_log_type_enabled(_AKTrafficLogSubsystem(), OS_LOG_TYPE_ERROR)) {
                                    os_log_error(_AKTrafficLogSubsystem(), "Unable to get Anisette data even after provisioning was attempted. Error: %@", newError);
                                }
                            }
                            completion(newData, newError);
                        });
                    }
                }];
            } else {
                if (os_log_type_enabled(_AKTrafficLogSubsystem(), OS_LOG_TYPE_DEBUG)) {
                    os_log_debug(_AKTrafficLogSubsystem(), "Skipping Anisette provisioning, per client request.");
                }
                completion(nil, error);
            }
        } else {
            completion(anisetteData, error);
        }
    });
}

- (AKAnisetteData *)_unsafe_anisetteDataWithRoutingInfoForDSID:(unsigned long long)dsid withError:(NSError **)error {
    AKAnisetteData *anisetteData = nil;
    unsigned long long routingInfo;
    
    int result = [AKADIProxy getIDMSRoutingInfo:&routingInfo forDSID:dsid];
    if (result != 0) {
        if (os_log_type_enabled(_AKTrafficLogSubsystem(), OS_LOG_TYPE_ERROR)) {
            os_log_error(_AKTrafficLogSubsystem(), "ADIGetIDMSRouting failed! Error: %@", @(result));
        }
        if (error) {
            *error = [NSError ak_wrappedAnisetteError:result];
        }
    } else {
        anisetteData = [self _unsafe_anisetteDataForDSID:dsid withError:error];
        anisetteData.routingInfo = routingInfo;
    }
    
    return anisetteData;
}

- (AKAnisetteData *)_unsafe_anisetteDataForDSID:(unsigned long long)dsid withError:(NSError **)error {
    AKAnisetteData *anisetteData = nil;
    
    if (os_log_type_enabled(_AKTrafficLogSubsystem(), OS_LOG_TYPE_DEBUG)) {
        os_log_debug(_AKTrafficLogSubsystem(), "Looking for Anisette data...");
    }
    
    char *mid;
    unsigned int midSize;
    char *otp;
    unsigned int otpSize;
    
    int ret = [AKADIProxy requestOTPForDSID:dsid outMID:&mid outMIDSize:&midSize outOTP:&otp outOTPSize:&otpSize];
    if (ret != 0) {
        if (ret == -45061) {
            if (os_log_type_enabled(_AKTrafficLogSubsystem(), OS_LOG_TYPE_ERROR)) {
                os_log_error(_AKTrafficLogSubsystem(), "The DSID %@ is not provisioned for Anisette.", @(dsid));
            }
        } else {
            if (os_log_type_enabled(_AKTrafficLogSubsystem(), OS_LOG_TYPE_ERROR)) {
                os_log_error(_AKTrafficLogSubsystem(), "ADIOTPRequest failed. Error: %@", @(ret));
            }
        }
        if (error) {
            *error = [NSError ak_wrappedAnisetteError:ret];
        }
    } else {
        NSData *midData = [[NSData alloc] initWithBytesNoCopy:mid length:midSize freeWhenDone:NO];
        NSData *otpData = [[NSData alloc] initWithBytesNoCopy:otp length:otpSize freeWhenDone:NO];
        
        NSString *midString = [midData base64EncodedStringWithOptions:0x0];
        NSString *otpString = [otpData base64EncodedStringWithOptions:0x0];
        
        if (os_log_type_enabled(_AKTrafficLogSubsystem(), OS_LOG_TYPE_DEBUG)) {
            os_log_debug(_AKTrafficLogSubsystem(), "Anisette Info: mid - %@ otp - %@", midString, otpString);
        }
        
        if (mid) {
            [AKADIProxy dispose:mid];
        }
        
        if (otp) {
            [AKADIProxy dispose:otp];
        }
        
        anisetteData = [[AKAnisetteData alloc] init];
        anisetteData.machineID = midString;
        anisetteData.oneTimePassword = otpString;
    }
    
    return anisetteData;
}

- (void)provisionAnisetteWithCompletion:(void (^)(BOOL, NSError *))completion {
    dispatch_async(gAnisetteQueue, ^{
        [self _unsafe_provisionAnisetteWithCompletion:completion];
    });
}

- (void)_unsafe_provisionAnisetteWithCompletion:(void (^)(BOOL, NSError *))completion {
    if (os_log_type_enabled(_AKLogSystem(), OS_LOG_TYPE_DEFAULT)) {
        os_log(_AKLogSystem(), "Kicking off Anisette provisioning....");
    }
    
    [[AKURLBagService sharedBagService] clearSessionCache];
    
    AKURLBag *bag = [AKURLBag sharedBag];
    unsigned long long dsid = [self.class activeAnisetteDSIDWithEnvironment:[bag IDMSEnvironment]];
    
    int ret = [AKADIProxy isMachineProvisioned:dsid];
    if (ret != -45061) {
        if (os_log_type_enabled(_AKLogSystem(), OS_LOG_TYPE_ERROR)) {
            os_log_error(_AKLogSystem(), "Anisette is already provisioned!");
        }
        NSError *error = [NSError errorWithDomain:@"AKAnisetteError" code:-8006 userInfo:nil];
        completion(NO, error);
        return;
    }
    
    NSURLRequest *request = [self _createProvisioningStartURLRequest];
    if (request == nil) {
        if (os_log_type_enabled(_AKLogSystem(), OS_LOG_TYPE_ERROR)) {
            os_log_error(_AKLogSystem(), "Unable to create start-provisioning URL request!");
        }
        NSError *error = [NSError errorWithDomain:@"AKAnisetteError" code:-8005 userInfo:nil];
        completion(NO, error);
        return;
    }
    
    dispatch_semaphore_t sem = dispatch_semaphore_create(0);
    
    if (os_log_type_enabled(_AKLogSystem(), OS_LOG_TYPE_DEBUG)) {
        os_log_debug(_AKLogSystem(), "Starting provisioning with headers: %@", request.allHTTPHeaderFields);
    }
    
    __block NSDictionary *responseData = nil;
    AKURLSession *session = [AKURLSession sharedAnisetteFreeURLSession];
    [session beginDataTaskWithRequest:request completionHandler:^(NSData *data, NSHTTPURLResponse *response, NSError *error) {
        if (error) {
            if (os_log_type_enabled(_AKLogSystem(), OS_LOG_TYPE_ERROR)) {
                os_log_error(_AKLogSystem(), "Start provisioning request failed! Error: %@", error);
            }
        } else {
            if (![response isKindOfClass:[NSHTTPURLResponse class]]) {
                if (os_log_type_enabled(_AKLogSystem(), OS_LOG_TYPE_ERROR)) {
                    os_log_error(_AKLogSystem(), "Unexpected response class! %@", response);
                }
            } else {
                if (os_log_type_enabled(_AKLogSystem(), OS_LOG_TYPE_DEFAULT)) {
                    os_log(_AKLogSystem(), "Start provisioning response code: %@", @(response.statusCode));
                }
                if (data != nil && response.statusCode != 200) {
                    NSString *body = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
                    if (os_log_type_enabled(_AKLogSystem(), OS_LOG_TYPE_DEFAULT)) {
                        os_log(_AKLogSystem(), "Start provisioning response body: %@", body);
                    }
                }
                if (data != nil) {
                    responseData = [NSDictionary ak_dictionaryWithResponseData:data];
                }
            }
        }
        
        dispatch_semaphore_signal(sem);
    }];
    
    dispatch_semaphore_wait(sem, -1);
    
    if (responseData == nil) {
        // error we didn't get the result from the server
        NSError *error = [NSError errorWithDomain:@"AKAnisetteError" code:-8007 userInfo:nil];
        completion(NO, error);
        return;
    }
    
    // get spim from results
    
    // int ret = AKADIProxy startProvisioningWithDSID:dsid SPIM CPIM
    // if (ret != 0) {
    //    ADIProvisioningStart failed. Error: %@
    //    NSError *error = [NSERror ak_wrappedAnisetteError:ret]
    //    completion(NO, error)
    //    return;
    // }
    //
    // NSURLRequest *endRequest = _createProvisioningEndURLRequestWithCPIM
    // AKURLSession *session = [AKURLSession sharedAnisetteFreeURLSession];
    // [session beginDataTaskWithRequest:request completionHandler:^(NSData *data, NSHTTPURLResponse *response, NSError *error) {
    // }];
}

- (void)syncAnisetteWithSIMData:(NSData *)data completion:(void (^)(BOOL, NSError *))completion {
    dispatch_async(gAnisetteQueue, ^{
        // TODO
        // this is another long one
    });
}

- (void)eraseAnisetteWithCompletion:(void (^)(BOOL, NSError *))completion {
    dispatch_async(gAnisetteQueue, ^{
        if (os_log_type_enabled(_AKLogSystem(), OS_LOG_TYPE_DEFAULT)) {
            os_log(_AKLogSystem(), "Erasing Anisette provisioning data...");
        }
        
        AKURLBag *bag = [AKURLBag sharedBag];
        unsigned long long dsid = [self.class activeAnisetteDSIDWithEnvironment:[bag IDMSEnvironment]];
        
        int ret = [AKADIProxy eraseProvisioningForDSID:dsid];
        if (ret != 0) {
            if (os_log_type_enabled(_AKLogSystem(), OS_LOG_TYPE_ERROR)) {
                os_log_error(_AKLogSystem(), "Erase failed! Error: %@", @(ret));
            }
            completion(NO, [NSError ak_wrappedAnisetteError:ret]);
         
        } else {
            if (os_log_type_enabled(_AKLogSystem(), OS_LOG_TYPE_DEFAULT)) {
                os_log(_AKLogSystem(), "Erasing Anisette data succeeded!");
            }
            completion(YES, nil);
        }
    });
}

- (void)legacyAnisetteDataForDSID:(NSString *)dsid withCompletion:(void (^)(AKAnisetteData *, NSError *))completion {
    dispatch_async(gAnisetteQueue, ^{
        unsigned long long ldsid;
        NSScanner *scanner = [NSScanner scannerWithString:dsid];
        BOOL found = [scanner scanUnsignedLongLong:&ldsid];
        if (!found) {
            NSError *error = [NSError errorWithDomain:@"AKAnisetteError" code:-8003 userInfo:nil];
            completion(nil, error);
            return;
        }
        
        NSError *error = nil;
        AKAnisetteData *anisetteData = [self _unsafe_anisetteDataForDSID:ldsid withError:&error];
        completion(anisetteData, error);
    });
}

@end
